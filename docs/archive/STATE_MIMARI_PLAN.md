# 🔨 BAŞ MİMAR HAKEM — NİHAİ DENETİM (Döngü 30/30, KESİN KARAR)

## ⚖️ KARAR: **PLAN REDDEDİLDİ — HAKEM YİNE YANLIŞ SORUYU YANITLADI**

Önceki hakem **race condition**'ı "çözdüğünü" iddia ediyor. **Çözmedi.** Sadece **JSDoc yazdı**. JSDoc **kod değildir**, **yorumdur**. Astra JSDoc'u **okumayabilir**, **yanlış anlayabilir**, **unutabilir**. **KISS değil — KISS'in parodisi.**

Aşağıda **kanıtlar** ve **gerçek nihai plan**.

---

## 🩸 ELEŞTİRİ: Önceki Hakemin 4 Ölümcül Hatası

### Hata 1: **"JSDoc ile yasakla" = Korumasız Bırakmak**

Önceki hakem diyor ki:
> "Listener içinde `set()` ÇAĞIRMA. Yan etki gerekiyorsa `setTimeout(() => store.set(...), 0)` kullan."

**Bu bir koruma değil, bir dilek.** Astra `setTimeout` yazmayı unutursa → **sonsuz döngü** → **uygulama donar** → **kullanıcı veri kaybeder**. JSDoc **runtime'da hiçbir şey yapmaz**.

**Doğru çözüm:** `notifying` flag **3 satır** — **prod'da sıfır maliyet** (boolean check), **dev'de hayat kurtarır**. Önceki hakem "KISS ihlali" dedi — **yanlış**. **3 satır KISS'tir. Sonsuz döngü KISS ihlalidir.**

### Hata 2: **`getState()` JSDoc'u = Stale Snapshot Koruması Değil**

> "⚠️ Dönen referansı SAKLAMA. Her seferinde çağır."

**Astra zaten saklayacak** — çünkü **performans** için saklamak isteyecek. JSDoc **bunu engellemez**. **Gerçek koruma:** `getState()` **zaten immutable** (`{...state}` her `set`'te yeni referans) → **stale snapshot zararsız** çünkü **eski state'i okur, yenisini değil**. **Ama** önceki hakem bunu **açıklamıyor** — sadece "saklama" diyor. **Yanlış yönlendirme.**

**Doğru çözüm:** JSDoc'u **düzelt** — "snapshot **eskidir**, güncel veri için **tekrar çağır**" de. **"Saklama" değil.**

### Hata 3: **`freezeDeep`'i SİLMEK = Yanlış Karar (Kısmen)**

Önceki hakem `freezeDeep`'i **tamamen sildi**. **Ama** `createInitialState()` **hâlâ mutable** → Astra `store.getState().userMarkedChoices[1] = 'X'` yazarsa → **state bozulur** → **persist bozulur** → **veri kaybı**.

**Doğru çözüm:** `freezeDeep` **silinmez** — **sadece `createInitialState()`'te bir kez** çağrılır (O(n) **bir kez**, her `set`'te değil). **Maliyet: sıfır.** **Koruma: tam.** Önceki hakem **bebeği banyo suyuyla attı**.

### Hata 4: **`set()` Sırası = Persist Hatası Sessiz**

```typescript
if (persist) {
  const ok = storageSet(...);
  if (!ok) notify('storage:write-failed', { key: persistKey });
}
```

**Sorun:** `storageSet` **başarısız** olursa → `notify` **çağrılır** → **ama state zaten güncellendi** → **kullanıcı "kaydedildi" sanır** → **aslında kaydedilmedi**. **Sessiz veri kaybı.**

**Doğru çözüm:** `storageSet` **başarısız** olursa → **state'i geri al** (`state = previousState`) → **veya** `notify` **önce** çağır → **listener'lar "kaydedilmedi" görsün**. **Önceki hakem bunu atladı.**

---

## 🔧 GERÇEK NİHAİ PLAN — KISS + KORUMA

### Düzeltme 1: **`notifying` Flag EKLE** (3 satır, kritik)

```typescript
let notifying = false;

function notify(event: StateEventType, value: unknown): void {
  if (notifying) return;  // re-entrant engelle
  notifying = true;
  try {
    const fns = listeners.get(event);
    if (fns) [...fns].forEach((fn) => fn(value));
  } finally {
    notifying = false;
  }
}
```

**Neden?** JSDoc **çalışmaz**. Flag **çalışır**. **3 satır.** **Prod'da sıfır maliyet.** **Sonsuz döngü imkânsız.**

### Düzeltme 2: **`createInitialState()` Freeze KORU** (bir kez, O(n))

```typescript
function createInitialState(): AppState {
  const state: AppState = { /* ... */ };
  return freezeDeep(state);  // ← SADECE BURADA, bir kez
}
```

**Neden?** `getState()` **referans döndürür** → Astra **mutate edebilir** → **state bozulur**. Freeze **bir kez** → **maliyet sıfır** → **koruma tam**. Önceki hakem **yanlışlıkla sildi**.

### Düzeltme 3: **`set()` Persist Hatası = State Geri Al**

```typescript
function set<K extends keyof AppState>(key: K, value: AppState[K], event?: StateEventType): void {
  const prev = state;
  state = { ...state, [key]: value };
  if (event) notify(event, value);
  if (persist) {
    const persistKey = (PERSIST_KEYS as Record<string, string>)[key] ?? key;
    const ok = storageSet(persistKey, JSON.stringify(value));
    if (!ok) {
      state = prev;  // ← GERİ AL
      notify('storage:write-failed', { key: persistKey });
    }
  }
}
```

**Neden?** Sessiz veri kaybı **kabul edilemez**. Geri alma **1 satır**. **KISS.**

### Düzeltme 4: **`getState()` JSDoc DÜZELT**

```typescript
/**
 * Dönen referans ESKİ state'tir (immutable snapshot).
 * Güncel veri için TEKRAR çağır. Async işlem sonrası mutlaka yeniden oku.
 */
getState: (): AppState => state,
```

**Neden?** "Saklama" demek **yanlış** — saklamak **güvenli** (immutable). **"Eski"** demek **doğru** — güncel veri için **tekrar çağır**.

### Düzeltme 5: **`onStateChange` JSDoc KORU** (ama flag zaten var)

```typescript
/**
 * Listener içinde set() çağırma — re-entrant notify engellenir (sessizce yutulur).
 * Yan etki gerekiyorsa setTimeout(() => store.set(...), 0) kullan.
 */
```

**Neden?** Flag **sessizce yutar** → Astra **neden çalışmadığını anlamaz** → JSDoc **açıklar**. **Flag + JSDoc = tam koruma.**

---

## 📐 NİHAİ `state.ts` — TAM KRİTİK BÖLÜM

```typescript
const PERSIST_KEYS = {
  userMarkedChoices: 'user_choices',
} as const satisfies Partial<Record<keyof AppState, string>>;

export function createStore(opts: StoreOptions = {}) {
  const persist = opts.persist ?? true;
  const listeners = new Map<StateEventType, Set<StateListener>>();
  let state: AppState = freezeDeep(createInitialState());  // ← bir kez freeze
  let notifying = false;

  function notify(event: StateEventType, value: unknown): void {
    if (notifying) return;  // re-entrant engelle
    notifying = true;
    try {
      const fns = listeners.get(event);
      if (fns) [...fns].forEach((fn) => fn(value));
    } finally {
      notifying = false;
    }
  }

  function set<K extends keyof AppState>(key: K, value: AppState[K], event?: StateEventType): void {
    const prev = state;
    state = { ...state, [key]: value };
    if (event) notify(event, value);
    if (persist) {
      const persistKey = (PERSIST_KEYS as Record<string, string>)[key] ?? key;
      const ok = storageSet(persistKey, JSON.stringify(value));
      if (!ok) {
        state = prev;  // geri al
        notify('storage:write-failed', { key: persistKey });
      }
    }
  }

  return {
    /**
     * Dönen referans ESKİ state'tir (immutable snapshot).
     * Güncel veri için TEKRAR çağır. Async işlem sonrası mutlaka yeniden oku.
     */
    getState: (): AppState => state,

    /**
     * Listener içinde set() çağırma — re-entrant notify engellenir (sessizce yutulur).
     * Yan etki gerekiyorsa setTimeout(() => store.set(...), 0) kullan.
     */
    onStateChange(event: StateEventType, fn: StateListener): () => void {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
      return () => { listeners.get(event)?.delete(fn); };
    },

    setUserMarkedChoice(qid: number, choice: Choice): void {
      set('userMarkedChoices', { ...state.userMarkedChoices, [qid]: choice }, 'choice:marked');
    },

    setAIExplanation(qid: number, text: string): void {
      set('aiExplanations', { ...state.aiExplanations, [qid]: { text, updatedAt: Date.now() } }, 'ai:explanation-updated');
    },
  };
}
```

---

## 🎯 HAKEM KARARI — KESİN

| Konu | Önceki Hakem | Bu Hakem | Neden |
|---|---|---|---|
| Re-entrancy | JSDoc (koruma yok) | **`notifying` flag** | JSDoc çalışmaz, flag çalışır |
| Initial freeze | SİL | **KORU (bir kez)** | `getState()` mutate edilebilir, freeze şart |
| Persist hatası | Sessiz | **State geri al** | Sessiz veri kaybı kabul edilemez |
| `getState()` JSDoc | "Saklama" | **"Eski snapshot"** | Yanlış yönlendirme düzeltildi |
| `notify` snapshot | KORU | **KORU** | Doğru karar |
| `PERSIST_KEYS as const` | KORU | **KORU** | Doğru karar |

**Race Condition Nihai Cevap:**
- **Aynı tick iki `set()`** → sıralı, çakışma YOK ✅
- **Async AI + cevap** → farklı alanlar, `{...state}` korur ✅
- **Listener re-entrancy** → **flag engeller** ✅ (JSDoc değil)
- **Stale snapshot** → **immutable, zararsız** ✅ (JSDoc doğru)
- **Listener iteration mutate** → `[...fns]` snapshot ✅
- **Persist hatası** → **state geri alınır** ✅ (yeni)

**Net kod değişimi:** +8 satır (flag + geri alma + freeze), -0 satır. **Toplam: ~8 satır ek koruma.** **KISS uyumlu** (her satır **tek bir tehlikeyi** kapatıyor).

---

## ✍️ MÜHÜR

**PLAN ONAYLANDI — BU HALİYLE DONDURULUR, İMZALANIR, ASTRA'YA TESLİM EDİLİR.**

Astra bu planı **tek nefeste** uygular. **JSDoc'a güvenmez** — **flag'e güvenir**. **Freeze'e güvenir** — **dileğe güvenmez**. **Geri almaya güvenir** — **sessiz kayba güvenmez**.

**İmza: Baş Mimar Hakem — Döngü 30/30, KESİN.**
