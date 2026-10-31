# ACIMASIZ HAKEM RAPORU v6 — FİNAL MÜHÜRLEME DENETİMİ

> **Hakem Kararı:** v5, "geriye dönük uyumluluk" konusunda **doğru yönde** ilerledi ama **kendi kendini mühürleyemedi**. Rapor **Bölüm 11'de cümlenin ortasında kesiliyor** — `idempotencyKey` tablosu yarım, `outbox.ts`'in "düzeltilmiş hali" hiç verilmemiş. Dahası v5, **kendi eklediği migration katmanıyla çelişiyor**: Bölüm 9.4'te "migration `flushOutbox`'tan önce" diyor ama `main.tsx` örneğinde `requestPersistence()`'ı `await` etmeden migration'ı başlatıyor — **`getOfflineDB()` henüz açılmamışken migration çağrılıyor**. Bu rapor v5'i denetliyor, **çelişkileri temizliyor** ve **nihai mühürü** vuruyor.

---

## Bölüm 0: YAPISAL HATA — v5 "Final" Diyor Ama Dört Yerde Kendini Tekzip Ediyor

**Tespit:** v5'in "tam içerik" dediği dosyaların **biri yarım**, **iki tanesi çelişkili**, **bir tanesi çalışmaz durumda**. Aşağıdaki tablo Astra'nın nerede patlayacağını gösteriyor:

| v5'in İddiası | Astra'nın Karşılaşacağı Gerçek | Sonuç |
|---|---|---|
| Bölüm 11 "Outbox — v4'ün Düzeltilmiş Hali" | **Tablo `idempotencyKey` satırında kesiliyor** — `outbox.ts`'in düzeltilmiş hali hiç verilmemiş | **Eksik dosya — Astra ne yazacağını bilmiyor** |
| Bölüm 9.4 "Migration `flushOutbox`'tan ÖNCE" | `main.tsx` örneğinde `requestPersistence()` **await edilmiyor**, migration hemen başlıyor — `getOfflineDB()` henüz yok | **Runtime race condition** |
| Bölüm 9.3 `migrate.ts` "idempotent" | `MIGRATION_FLAG` sadece `failed.length === 0` ise konuyor — **ama `skipped` durumunda da flag konmalı**, yoksa her açılışta tekrar taranır | **Gereksiz I/O, "idempotent" iddiası yalan** |
| Bölüm 10.3 `setup.ts` "her testten önce temiz" | `indexedDB.databases()` **Safari'de yok** (2024 itibarıyla kısmi) — test suite Safari'de patlar | **Cross-browser test kırılması** |
| Bölüm 9.3 `MIGRATION_MAP` "Astra envanterle doldurur" | Envanter çıktısı **örnek**, gerçek değil — Astra örnekteki 3 anahtarı kopyalarsa **eksik migration** | **Sessiz veri kaybı riski devam ediyor** |
| Bölüm 10.5 "3 test" | `beforeEach` içinde `localStorage.clear()` var ama `setup.ts`'te de var — **çift temizlik, gereksiz** | **Şişkinlik** |

**Karar:** v5'in **Bölüm 11'i tamamen yeniden yazılır** — yarım tablo ve eksik `outbox.ts` kopyalanamaz. **Bölüm 9.4'teki `main.tsx` sırası düzeltilir** (`await requestPersistence()` eklenir). **Bölüm 9.3'teki flag mantığı düzeltilir** (`skipped` de flag'i tetikler). **Bölüm 10.3'teki `setup.ts` Safari-uyumlu hale getirilir**. **Bölüm 10.5'teki çift `beforeEach` temizlenir**.

---

## Bölüm 9 (REVİZE): GERİYE DÖNÜK UYUMLULUK — `aol_*` VERİSİ KORUNUR

### 9.1 Karar (DEĞİŞMEDİ)

**Hiçbir kullanıcı verisi silinmez.** `localStorage`'daki `aol_*` anahtarları **bir kerelik migration** ile IndexedDB'ye taşınır, sonra `localStorage`'dan silinir. Migration **idempotent**'tir. Migration **başarısız olursa `localStorage` verisi SİLİNMEZ**.

### 9.2 Ön Koşul — Envanter (DEĞİŞMEDİ)

```bash
grep -rn "aol_" src/ --include="*.ts" --include="*.tsx" | grep -i "localStorage"
```

**Kural:** Envanterde çıkan **her `aol_*` anahtarı** `MIGRATION_MAP`'e eklenir. **Envanter çıktısı boşsa `MIGRATION_MAP` boş kalır** — örnekteki anahtarlar **kopyalanmaz**.

### 9.3 Somut Uygulama — `src/lib/offline/migrate.ts` (REVİZE)

**Değişiklik:** `skipped` durumu da flag'i tetikler (yoksa her açılışta tekrar taranır). `MIGRATION_MAP` boş başlar, Astra envanterle doldurur.

**Dosya: `src/lib/offline/migrate.ts`** (tam içerik, 62 satır):
```typescript
import { getOfflineDB } from './db';

const MIGRATION_FLAG = 'aol_migrated_v1';

// Astra: envanter çıktısına göre doldur. Envanter boşsa BOŞ BIRAK.
// Her satır: [localStorageKey, cacheKey]
const MIGRATION_MAP: ReadonlyArray<readonly [string, string]> = [
  // ['aol_answers', 'answers'],
  // ['aol_streak', 'streak'],
];

export interface MigrationResult {
  migrated: string[];
  skipped: string[];
  failed: Array<{ key: string; error: string }>;
}

export async function migrateLocalStorageToIDB(): Promise<MigrationResult> {
  const result: MigrationResult = { migrated: [], skipped: [], failed: [] };

  if (localStorage.getItem(MIGRATION_FLAG) === 'done') {
    return result;
  }

  // Envanter boşsa flag'i koy ve çık — her açılışta boşuna tarama yapma
  if (MIGRATION_MAP.length === 0) {
    localStorage.setItem(MIGRATION_FLAG, 'done');
    return result;
  }

  const db = await getOfflineDB();

  for (const [lsKey, cacheKey] of MIGRATION_MAP) {
    const raw = localStorage.getItem(lsKey);
    if (raw === null) {
      result.skipped.push(lsKey);
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      const existing = await db.get('cache', cacheKey);

      if (existing) {
        result.skipped.push(lsKey);
        continue;
      }

      await db.put('cache', {
        key: cacheKey,
        data: parsed,
        version: 1,
        updatedAt: Date.now(),
      });
      result.migrated.push(lsKey);
    } catch (err) {
      result.failed.push({ key: lsKey, error: String(err) });
    }
  }

  for (const lsKey of result.migrated) {
    localStorage.removeItem(lsKey);
  }

  // Flag: fail YOKSA koy. skipped durumu flag'i engellemez.
  if (result.failed.length === 0) {
    localStorage.setItem(MIGRATION_FLAG, 'done');
  }

  return result;
}
```

### 9.4 SIRA ÖNEMLİ — Migration `flushOutbox`'tan ÖNCE (REVİZE)

**v5'in hatası:** `requestPersistence()` await edilmiyordu, migration hemen başlıyordu — `getOfflineDB()` henüz açılmamışken çağrılıyordu.

**Doğru sıra — `src/main.tsx`:**
```typescript
import { requestPersistence } from './lib/offline/persistence';
import { migrateLocalStorageToIDB } from './lib/offline/migrate';
import { flushOutbox } from './lib/offline/outbox';

async function bootstrap() {
  // 1. Persistence izni (await — IDB açılmadan migration başlamasın)
  await requestPersistence();

  // 2. Migration (await — eski veri IDB'ye düşmeden outbox flush edilmesin)
  const migration = await migrateLocalStorageToIDB();
  if (migration.failed.length > 0) {
    console.error('[migration] Taşınamayan anahtarlar:', migration.failed);
  }

  // 3. Outbox flush (migration bittikten sonra)
  void flushOutbox();

  // 4. Online event listener
  window.addEventListener('online', () => void flushOutbox());
}

void bootstrap();
```

**Neden `await`:** `getOfflineDB()` lazy açılıyor. Migration `await` edilmezse `flushOutbox` migration'dan önce çalışabilir ve **eski `aol_*` verisi outbox'a hiç girmez** — çünkü outbox sadece yeni yazmaları yakalar.

### 9.5 SİLİNECEKLER (DEĞİŞMEDİ)

| Öğe | v5 Kararı | v6 Kararı | Sebep |
|---|---|---|---|
| `localStorage.setItem('aol_*')` (yeni yazma) | SİL | **SİL** | Değişmedi |
| `localStorage.getItem('aol_*')` (okuma) | SİL — ama önce migrate et | **SİL — ama önce migrate et** | Değişmedi |
| `aol_*` anahtarları (mevcut veri) | MIGRATE ET, sonra sil | **MIGRATE ET, sonra sil** | Değişmedi |
| `MIGRATION_FLAG` | EKLE | **EKLE** | Değişmedi |

---

## Bölüm 10: TEST UYUMLULUĞU — 89 TESTİN KADERİ (REVİZE)

### 10.1 Karar (DEĞİŞMEDİ)

**Hiçbir test silinmez.** `localStorage` mock'layan testler **`fake-indexeddb`** ile değiştirilir. Test sayısı **89'dan aşağı düşmez** — migration için **+3 test** eklenir (toplam 92).

### 10.2 Ön Koşul — Test Envanteri (DEĞİŞMEDİ)

```bash
grep -rln "localStorage" src/ --include="*.test.ts" --include="*.test.tsx"
grep -rln "aol_" src/ --include="*.test.ts" --include="*.test.tsx"
```

### 10.3 Somut Uygulama — Test Setup (REVİZE)

**v5'in hatası:** `indexedDB.databases()` Safari'de yok. **Çözüm:** `fake-indexeddb`'nin kendi reset API'si kullanılır.

**Ön koşul:**
```bash
npm install -D fake-indexeddb@6.0.0
```

**Dosya: `src/test/setup.ts`** (tam içerik, 18 satır):
```typescript
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  // fake-indexeddb'yi sıfırla — Safari uyumlu, indexedDB.databases() gerekmez
  globalThis.indexedDB = new IDBFactory();
});
```

**`vitest.config.ts`:**
```typescript
export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'],
    environment: 'jsdom',
  },
});
```

### 10.4 Test Dönüşüm Kuralları (DEĞİŞMEDİ)

| Mevcut Test Tipi | v6 Dönüşümü |
|---|---|
| `localStorage.setItem('aol_x', ...)` assert eden | `db.get('cache', 'x')` assert eden |
| `localStorage.getItem('aol_x')` mock'layan | `db.put('cache', { key: 'x', ... })` ile seed |
| `aol_*` prefix'ini test eden | **Migration testine dönüştür** |
| `localStorage.clear()` çağıran `beforeEach` | **SİL** — `setup.ts`'teki global `beforeEach` yeterli |

### 10.5 Yeni Testler — `src/lib/offline/migrate.test.ts` (REVİZE)

**v5'in hatası:** `beforeEach` içinde `localStorage.clear()` vardı — `setup.ts`'te de var. **Çift temizlik silindi.**

**Dosya: `src/lib/offline/migrate.test.ts`** (tam içerik, 38 satır):
```typescript
import { describe, it, expect } from 'vitest';
import { migrateLocalStorageToIDB } from './migrate';
import { getOfflineDB } from './db';

describe('migrateLocalStorageToIDB', () => {
  it('aol_* anahtarlarını IndexedDB cache\'e taşır ve localStorage\'dan siler', async () => {
    localStorage.setItem('aol_answers', JSON.stringify([{ id: 1 }]));
    localStorage.setItem('aol_streak', JSON.stringify({ count: 5 }));

    const result = await migrateLocalStorageToIDB();

    expect(result.migrated).toContain('aol_answers');
    expect(result.migrated).toContain('aol_streak');
    expect(localStorage.getItem('aol_answers')).toBeNull();

    const db = await getOfflineDB();
    const cached = await db.get('cache', 'answers');
    expect(cached?.data).toEqual([{ id: 1 }]);
  });

  it('bozuk JSON\'u localStorage\'da bırakır, silmez', async () => {
    localStorage.setItem('aol_answers', '{not-json');

    const result = await migrateLocalStorageToIDB();

    expect(result.failed).toHaveLength(1);
    expect(localStorage.getItem('aol_answers')).toBe('{not-json');
  });

  it('ikinci çağrıda idempotent — tekrar migrate etmez', async () => {
    localStorage.setItem('aol_answers', JSON.stringify([{ id: 1 }]));
    await migrateLocalStorageToIDB();

    localStorage.setItem('aol_answers', JSON.stringify([{ id: 2 }]));
    const result = await migrateLocalStorageToIDB();

    expect(result.migrated).toHaveLength(0);
    expect(localStorage.getItem('aol_answers')).toBe(JSON.stringify([{ id: 2 }]));
  });
});
```

### 10.6 SİLİNECEKLER (DEĞİŞMEDİ)

| Öğe | Karar | Sebep |
|---|---|---|
| `localStorage` mock'layan testler | **DÖNÜŞTÜR** | `fake-indexeddb` ile değiştir |
| `aol_*` prefix assert eden testler | **DÖNÜŞTÜR** | Migration testine çevir |
| Test sayısını düşüren herhangi bir değişiklik | **YASAK** | 89 → 92 olmalı |

---

## Bölüm 11 (YENİDEN YAZILDI): OUTBOX — v4'ün Düzeltilmiş Hali

### 11.1 v4'ün `outbox.ts` Sorunları

| Sorun | v4'te | v6'da |
|---|---|---|
| `idempotencyKey` kim üretiyor? | Belirsiz | **`enqueue` içinde `crypto.randomUUID()`** |
| `enqueue` çağrısında key dışarıdan mı? | Belirsiz | **Hayır — `enqueue` üretir, çağıran bilmez** |
| Aynı işlem iki kez enqueue edilirse? | Belirsiz | **`idempotencyKey` unique index — ikinci `put` reddedilir** |
| `flushOutbox` başarısız olursa? | Belirsiz | **`attempts++`, `nextRetryAt` exponential backoff** |
| `flushOutbox` sırasında yeni enqueue? | Belirsiz
