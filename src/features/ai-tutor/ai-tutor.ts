import { state, store, type AiExplanationEntry, type AiExplanationMessage } from '../../app/state.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { formatAiMarkdown } from '../../shared/simple-markdown.ts';
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
  readonly history?: ReadonlyArray<{ readonly query: string; readonly reply: string }>;
}

/** Zero-Knowledge Garantisi: dogru_cevap ve dogru_nedeni ASLA yüke dahil edilmez. */
export function buildZeroKnowledgePayload(
  q: Question,
  userQuery: string,
  fallbackSubject?: string | null,
  history?: ReadonlyArray<{ readonly query: string; readonly reply: string }>,
): SafeAiAskPayload {
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
    history: (history && history.length > 0) ? history : undefined,
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
        const history: AiExplanationMessage[] = [];
        if (Array.isArray(item.history)) {
          for (const h of item.history) {
            if (h && typeof h === 'object' && typeof h.query === 'string' && typeof h.reply === 'string') {
              history.push({
                query: h.query.trim().slice(0, 250),
                reply: String(h.reply).trim(),
                updatedAt: typeof h.updatedAt === 'number' ? h.updatedAt : Date.now(),
              });
            }
          }
        }
        valid[qid] = {
          query: item.query.trim().slice(0, 250),
          reply: item.reply.trim(),
          updatedAt: typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
          history: history.length > 0 ? history : undefined,
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
  box.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) {
    (document.getElementById(`aiAskInput_${qid}`) as HTMLInputElement | null)?.focus();
    renderInlineChatReply(qid);
  }
}

const svgLucideTrash = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
const svgAstrolabe = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="3.2" r="1.7"/><path d="M10 5.4c.6-.3 1.3-.4 2-.4s1.4.1 2 .4"/><circle cx="12" cy="13.5" r="7.5"/><circle cx="12" cy="13.5" r="4.2"/><line x1="6.8" y1="18.7" x2="17.2" y2="8.3"/><circle cx="12" cy="13.5" r="1" fill="currentColor"/></svg>';

export function cleanAiReplyText(raw: string): string {
  return raw ? raw.replace(/^(?:💡\s*)?(?:\*|_)?(?:Numûne-i Hiyel|Numune-i Hiyel|Hiyel|AI Öğretmen|İpucu)\s*(?:\*|_)?:\s*(?:\*|_)?/i, '').trim() : '';
}

/** Belirli bir soruyu (en yeni veya geçmişteki) siler */
export function deleteAiTurn(qid: number, turnIdx = -1): void {
  const entry = state.aiExplanations[qid];
  if (!entry) return;

  if (turnIdx === -1) {
    if (entry.history && entry.history.length > 0) {
      const nextActive = entry.history[0];
      const remaining = entry.history.slice(1);
      store.setAiExplanation(qid, {
        query: nextActive.query,
        reply: nextActive.reply,
        updatedAt: nextActive.updatedAt || Date.now(),
        history: remaining.length > 0 ? remaining : undefined,
      });
    } else {
      store.clearAiExplanation(qid);
    }
  } else if (entry.history && entry.history[turnIdx]) {
    const newHistory = [...entry.history];
    newHistory.splice(turnIdx, 1);
    store.setAiExplanation(qid, {
      ...entry,
      history: newHistory.length > 0 ? newHistory : undefined,
    });
  }

  syncAiQuestionDomState(qid);
  renderInlineChatReply(qid);
}

/** Soru altındaki chat kartını günceller veya render eder */
export function renderInlineChatReply(qid: number): void {
  if (typeof document === 'undefined') return;
  const card = document.getElementById(`aiChatReply_${qid}`);
  const entry = state.aiExplanations[qid];
  if (!card) return;
  if (!entry) {
    card.style.display = 'none';
    card.innerHTML = '';
    return;
  }
  card.style.display = 'flex';

  const historyHtml = (entry.history && entry.history.length > 0)
    ? `
      <div class="ai-chat-history-stack">
        ${entry.history.map((hist, idx) => `
          <details class="ai-history-turn" id="aiHist_${qid}_${idx}">
            <summary class="ai-history-turn-summary">
              <button type="button" class="btn-bubble-delete" data-action="delete-ai-turn" data-qid="${qid}" data-turn-idx="${idx}" title="Bu Soruyu Sil" aria-label="Bu Soruyu Sil">
                ${svgLucideTrash}
              </button>
              <span class="ai-chat-bubble ai-bubble-user is-history-bubble">
                <span class="ai-bubble-text">${escapeHtml(hist.query)}</span>
                <span class="ai-bubble-chevron">›</span>
              </span>
            </summary>
            <div class="ai-chat-bubble ai-bubble-bot is-history-reply">
              <div class="ai-bot-content">${formatAiMarkdown(cleanAiReplyText(hist.reply))}</div>
            </div>
          </details>
        `).join('')}
      </div>
    `
    : '';

  card.innerHTML = `
    <div class="ai-user-bubble-row">
      <button type="button" class="btn-bubble-delete" data-action="delete-ai-turn" data-qid="${qid}" data-turn-idx="-1" title="Bu Soruyu Sil" aria-label="Bu Soruyu Sil">
        ${svgLucideTrash}
      </button>
      <div class="ai-chat-bubble ai-bubble-user">
        <span class="ai-bubble-text">${escapeHtml(entry.query)}</span>
      </div>
    </div>
    <div class="ai-chat-bubble ai-bubble-bot">
      <div class="ai-bot-content">${formatAiMarkdown(cleanAiReplyText(entry.reply))}</div>
    </div>
    ${historyHtml}
  `;
}

function syncAiQuestionDomState(qid: number): void {
  if (typeof document === 'undefined') return;
  const hasReply = Boolean(state.aiExplanations[qid]);
  const isPending = state.pendingAiQuestions.has(qid);
  document.querySelectorAll<HTMLElement>(`#qnum_${qid}`).forEach(el => {
    el.classList.toggle('has-ai-reply', hasReply);
    el.classList.toggle('is-ai-pending', isPending);
    el.title = hasReply ? 'Numûne-i Hiyel yanıtını açıp kapatmak için dokun' : '';
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

  const existingEntry = state.aiExplanations[qid];
  const historyForPayload: Array<{ query: string; reply: string }> = [];
  if (existingEntry) {
    if (existingEntry.history && Array.isArray(existingEntry.history)) {
      const pastChronological = [...existingEntry.history].reverse();
      for (const h of pastChronological) historyForPayload.push({ query: h.query, reply: h.reply });
    }
    historyForPayload.push({ query: existingEntry.query, reply: existingEntry.reply });
  }

  // Yeni soruyu en üstte göster; önceki soruları altta '>' akordeon olarak topla
  const card = document.getElementById(`aiChatReply_${qid}`);
  if (card) {
    card.style.display = 'flex';
    const pendingHistory: Array<{ query: string; reply: string }> = [];
    if (existingEntry) {
      pendingHistory.push({ query: existingEntry.query, reply: existingEntry.reply });
      if (existingEntry.history) pendingHistory.push(...existingEntry.history);
    }
    const historyHtml = pendingHistory.length > 0
      ? `
        <div class="ai-chat-history-stack">
          ${pendingHistory.map((hist, idx) => `
            <details class="ai-history-turn" id="aiHistPending_${qid}_${idx}">
              <summary class="ai-history-turn-summary">
                <span class="ai-chat-bubble ai-bubble-user is-history-bubble">
                  <span class="ai-bubble-text">${escapeHtml(hist.query)}</span>
                  <span class="ai-bubble-chevron">›</span>
                </span>
              </summary>
              <div class="ai-chat-bubble ai-bubble-bot is-history-reply">
                ${formatAiMarkdown(hist.reply)}
              </div>
            </details>
          `).join('')}
        </div>
      `
      : '';

    card.innerHTML = `
      <div class="ai-user-bubble-row">
        <div class="ai-chat-bubble ai-bubble-user is-pending">
          <span class="ai-bubble-text">${escapeHtml(rawQuery)}</span>
        </div>
      </div>
      <div class="ai-chat-bubble ai-bubble-bot is-loading">
        <span class="ai-loading-spinner">${svgAstrolabe}</span> Numûne-i Hiyel düşünüyor...
      </div>
      ${historyHtml}
    `;
  }

  const payload = buildZeroKnowledgePayload(q, rawQuery, state.currentSubject, historyForPayload);
  try {
    const res = await fetch('/api/ask-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as { reply?: string; error?: string } | null;
    let replyText = '';
    if (data?.reply) {
      replyText = cleanAiReplyText(data.reply);
    } else if (data?.error) {
      replyText = `⚠️ Hata (${res.status}): ${data.error}`;
    } else {
      replyText = `⚠️ Sunucu yanıtı alınamadı (HTTP ${res.status}). Cloudflare Functions yapılandırmasını kontrol ediniz.`;
    }
    store.appendAiQuestionReply(qid, payload.userQuery, replyText);
    if (input) input.value = '';
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    store.appendAiQuestionReply(qid, payload.userQuery, `⚠️ Bağlantı hatası: ${errMessage}. Sunucuya erişilemedi.`);
  } finally {
    store.setPendingAiQuestion(qid, false);
    syncAiQuestionDomState(qid);
    renderInlineChatReply(qid);
  }
}

/** Geriye dönük uyumluluk: Balon yerine doğrudan soru altındaki chat alanını açar */
export function showAiReplyBubble(qid: number): void { toggleAiAskBox(qid); }
export function hideAiReplyBubble(): void { activeAiBubbleEl?.remove(); activeAiBubbleEl = null; }

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
    if (action === 'use-ai-chip' && qid) {
      const prompt = actionEl?.dataset.prompt || '';
      const input = document.getElementById(`aiAskInput_${qid}`) as HTMLInputElement | null;
      if (input) input.value = prompt;
      void submitAiQuestion(qid);
      return;
    }
    if (action === 'show-ai-reply' && qid) { toggleAiAskBox(qid); return; }
    if (action === 'delete-ai-turn' && qid) {
      e.stopPropagation(); e.preventDefault();
      const turnIdx = actionEl?.dataset.turnIdx !== undefined ? Number(actionEl.dataset.turnIdx) : -1;
      deleteAiTurn(qid, turnIdx);
      return;
    }
    if (action === 'clear-ai-chat' && qid) {
      e.stopPropagation(); e.preventDefault(); deleteAiTurn(qid, -1); return;
    }
    if ((action === 'close-ai-chat' || action === 'close-ai-box') && qid) {
      const box = document.getElementById(`aiAskBox_${qid}`);
      if (box) box.style.display = 'none';
      const card = document.getElementById(`aiChatReply_${qid}`);
      if (card) card.style.display = 'none';
      return;
    }
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

