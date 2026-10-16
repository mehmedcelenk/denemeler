import { state, store, type AiExplanationEntry } from '../../app/state.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import { escapeHtml } from '../../shared/escape.ts';
import type { Question } from '../../data/question.ts';

let activeAiBubbleEl: HTMLElement | null = null;
const lastCooldownAt = new Map<number, number>();
let isTutorInitialized = false;

export interface SafeAiAskPayload {
  readonly stem: string;
  readonly choices: Readonly<Record<string, string>>;
  readonly subject: string;
  readonly topic: string;
  readonly userQuery: string;
}

/** Zero-Knowledge Garantisi: dogru_cevap ve dogru_nedeni ASLA yüke dahil edilmez. */
export function buildZeroKnowledgePayload(q: Question, userQuery: string, fallbackSubject?: string | null): SafeAiAskPayload {
  const choices: Record<string, string> = {
    A: String(q.secenekler?.A || '').slice(0, 500),
    B: String(q.secenekler?.B || '').slice(0, 500),
    C: String(q.secenekler?.C || '').slice(0, 500),
    D: String(q.secenekler?.D || '').slice(0, 500),
  };
  if (q.secenekler?.E) choices.E = String(q.secenekler.E).slice(0, 500);
  return {
    stem: String(q.soru || '').slice(0, 2000),
    choices,
    subject: String(q.ders || fallbackSubject || ''),
    topic: String(q.alt_konu || q.ana_konu || ''),
    userQuery: userQuery.trim().slice(0, 250),
  };
}

/** Kayıtlı AI açıklamalarını localStorage'dan doğrular ve yükler. */
export function loadSavedAiExplanations(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(StorageKeys.AI_EXPLANATIONS);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
    const valid: Record<number, AiExplanationEntry> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const qid = Number(k);
      if (!Number.isInteger(qid) || qid <= 0 || !v || typeof v !== 'object') continue;
      const item = v as Record<string, unknown>;
      if (typeof item.query === 'string' && item.query.trim() && typeof item.reply === 'string' && item.reply.trim()) {
        valid[qid] = {
          query: item.query.trim().slice(0, 250),
          reply: item.reply.trim(),
          updatedAt: typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
        };
      }
    }
    store.setAiExplanations(valid, false);
  } catch {}
}

/** Soru altındaki AI sorma kutusunu açar/kapatır; kayıtlı yanıt varsa balonu da gösterir. */
export function toggleAiAskBox(qid: number): void {
  if (typeof document === 'undefined') return;
  const box = document.getElementById(`aiAskBox_${qid}`);
  if (!box) return;
  const isHidden = box.style.display === 'none' || !box.style.display;
  box.style.display = isHidden ? 'block' : 'none';
  if (isHidden) {
    (document.getElementById(`aiAskInput_${qid}`) as HTMLInputElement | null)?.focus();
    if (state.aiExplanations[qid]) showAiReplyBubble(qid);
  }
}

function syncAiQuestionDomState(qid: number): void {
  if (typeof document === 'undefined') return;
  const hasReply = Boolean(state.aiExplanations[qid]);
  const isPending = state.pendingAiQuestions.has(qid);
  document.querySelectorAll<HTMLElement>(`#qnum_${qid}`).forEach(el => {
    el.classList.toggle('has-ai-reply', hasReply);
    el.classList.toggle('is-ai-pending', isPending);
    el.title = hasReply ? 'AI Öğretmen yanıtını görmek için dokun' : '';
  });
  document.querySelectorAll<HTMLElement>(`#btnAiAsk_${qid}`).forEach(btn => {
    btn.classList.toggle('has-ai-reply', hasReply);
  });
}

/** Öğrencinin sorusunu arka planda /api/ask-ai uç noktasına gönderir ve yanıtı kaydeder. */
export async function submitAiQuestion(qid: number): Promise<void> {
  if (typeof document === 'undefined') return;
  const input = document.getElementById(`aiAskInput_${qid}`) as HTMLInputElement | null;
  const rawQuery = input ? input.value.trim() : '';
  if (rawQuery.length < 2 || rawQuery.length > 250) { input?.focus(); return; }
  if (state.pendingAiQuestions.has(qid)) return;
  const now = Date.now();
  if (now - (lastCooldownAt.get(qid) || 0) < 5000) return;

  const q = state.bookletQuestions.find(item => item.id === qid) || state.allData.find(item => item.id === qid);
  if (!q) return;

  lastCooldownAt.set(qid, now);
  store.setPendingAiQuestion(qid, true);
  syncAiQuestionDomState(qid);
  const box = document.getElementById(`aiAskBox_${qid}`);
  if (box) box.style.display = 'none';

  const payload = buildZeroKnowledgePayload(q, rawQuery, state.currentSubject);
  try {
    const res = await fetch('/api/ask-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as { reply?: string; error?: string } | null;
    let replyText = '';
    if (res.ok && data?.reply) {
      replyText = data.reply.trim();
    } else if (data?.reply) {
      replyText = data.reply.trim();
    } else if (data?.error) {
      replyText = `⚠️ Hata (${res.status}): ${data.error}`;
    } else {
      replyText = `⚠️ Sunucu yanıtı alınamadı (HTTP ${res.status}). Cloudflare Functions yapılandırmasını kontrol ediniz.`;
    }
    store.setAiExplanation(qid, { query: payload.userQuery, reply: replyText, updatedAt: Date.now() });
    if (input) input.value = '';
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    store.setAiExplanation(qid, {
      query: payload.userQuery,
      reply: `⚠️ Bağlantı hatası: ${errMessage}. Sunucuya erişilemedi.`,
      updatedAt: Date.now(),
    });
  } finally {
    store.setPendingAiQuestion(qid, false);
    syncAiQuestionDomState(qid);
    if (document.getElementById(`qnum_${qid}`)) showAiReplyBubble(qid);
  }
}

/** Soru numarasının üzerinde/altında kaydırılabilir AI açıklama baloncuğu açar. */
export function showAiReplyBubble(qid: number, targetEl?: HTMLElement | null): void {
  hideAiReplyBubble();
  if (typeof document === 'undefined') return;
  const entry = state.aiExplanations[qid];
  const el = targetEl || document.getElementById(`qnum_${qid}`) || document.querySelector<HTMLElement>(`#bq_${qid} .q-number`);
  if (!entry || !el) return;

  const bubble = document.createElement('div');
  bubble.id = 'activeAiReplyBubble';
  bubble.className = 'answer-explanation-bubble ai-reply-bubble';
  bubble.innerHTML = `<div class="ai-reply-header"><span class="ai-reply-title">✨ AI Öğretmen Rehberi</span><button type="button" class="ai-reply-close" data-action="close-ai-reply" aria-label="Kapat">✕</button></div><div class="ai-reply-scroll-body"><div class="ai-reply-query">“${escapeHtml(entry.query)}”</div><div class="ai-reply-text">${escapeHtml(entry.reply).replace(/\n/g, '<br>')}</div></div>`;
  document.body.appendChild(bubble);
  activeAiBubbleEl = bubble;

  const rect = el.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const targetCenterX = rect.left + scrollLeft + (rect.width / 2);

  const container = el.closest<HTMLElement>('.booklet-question') || el.closest<HTMLElement>('.booklet-page') || document.body;
  const cRect = container.getBoundingClientRect();
  const cLeft = cRect.left + scrollLeft;
  const cRight = cRect.right + scrollLeft;

  // Ekran (viewport) sınırlarına göre maksimum genişlik ve konum
  const vpLeft = scrollLeft + 8;
  const vpRight = scrollLeft + window.innerWidth - 8;
  const maxW = Math.min(380, Math.max(200, Math.min(cRect.width - 8, window.innerWidth - 16)));
  bubble.style.maxWidth = `${maxW}px`;
  bubble.style.width = 'max-content';

  const bRect = bubble.getBoundingClientRect();
  const bubbleW = bRect.width || maxW;

  // Sol-sağ sınırları hem kart/sütun hem viewport içinde tut
  const minLeft = Math.max(cLeft + 4, vpLeft);
  const maxLeft = Math.min(cRight - 4 - bubbleW, vpRight - bubbleW);
  let bubbleLeft = targetCenterX - 24;
  if (bubbleLeft > maxLeft) bubbleLeft = maxLeft;
  if (bubbleLeft < minLeft) bubbleLeft = minLeft;
  bubble.style.left = `${bubbleLeft}px`;

  // Sivri oku doğrudan hedef elementin (soru numarası / nokta) merkezine kilitli tut
  const arrowPos = Math.max(14, Math.min(bubbleW - 14, targetCenterX - bubbleLeft));
  bubble.style.setProperty('--arrow-left', `${arrowPos}px`);

  // Dikey konumlandırma: Soru numarası yukarıdaysa veya balon üstte ekran dışına taşacaksa alta aç
  const estimatedH = 220;
  const isBelow = rect.top < (estimatedH + 20) || (rect.top - estimatedH < 65);
  if (isBelow) {
    bubble.classList.add('bubble-below');
    bubble.style.top = `${rect.bottom + scrollTop + 6}px`;
  } else {
    bubble.classList.remove('bubble-below');
    bubble.style.top = `${rect.top + scrollTop - 6}px`;
  }
}

export function hideAiReplyBubble(): void {
  activeAiBubbleEl?.remove();
  activeAiBubbleEl = null;
}

export function initAiTutor(): void {
  loadSavedAiExplanations();
  if (isTutorInitialized || typeof document === 'undefined') return;
  isTutorInitialized = true;
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const actionEl = target.closest<HTMLElement>('[data-action]');
    const action = actionEl?.dataset.action;
    const qid = Number(actionEl?.dataset.qid);
    if (action === 'toggle-ai-ask' && qid) { toggleAiAskBox(qid); return; }
    if (action === 'submit-ai-ask' && qid) { void submitAiQuestion(qid); return; }
    if (action === 'show-ai-reply' && qid && state.aiExplanations[qid]) { showAiReplyBubble(qid, actionEl); return; }
    if (action === 'close-ai-reply') { hideAiReplyBubble(); return; }
    if (activeAiBubbleEl && !target.closest('.ai-reply-bubble')) hideAiReplyBubble();
  });
  document.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null;
    if (e.key === 'Enter' && target?.classList.contains('ai-ask-input')) {
      e.preventDefault();
      const qid = Number(target.dataset.qid);
      if (qid) void submitAiQuestion(qid);
    }
  });
}

