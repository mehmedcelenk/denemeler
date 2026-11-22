/**
 * 2–6 adımlı evrensel geometrik görsel anlatım destesi (`kind: 'deck'`) sözleşmesi ve doğrulayıcısı.
 * Tüm derslerde (MAT, TDE, TAR, FİZ, DİN, İNG...) ham SVG olmadan, yalnızca yapısal JSON ile çalışır.
 */

export type VisualTone = 'indigo' | 'teal' | 'amber' | 'coral' | 'muted';
export type EyeMood = 'focus' | 'hack' | 'alert' | 'done';

interface StepBase {
  cue: string;
  badge?: string;
  mood?: EyeMood;
}

export interface HighlightStep extends StepBase {
  type: 'highlight';
  quote: string;
  focus: string;
  note: string;
}

export interface ToggleStep extends StepBase {
  type: 'toggle';
  op: string;
  rule: 'implies' | 'or' | 'and';
  leftLabel: string;
  leftStates: [string, string];
  rightLabel: string;
  rightStates: [string, string];
  init: [0 | 1, 0 | 1];
  okTag: string;
  zeroTag: string;
}

export interface MirrorStep extends StepBase {
  type: 'mirror';
  symbol: string;
  pairs: Array<{ from: string; to: string; note: string }>;
}

export interface BarStep extends StepBase {
  type: 'bar';
  totalLabel: string;
  segments: Array<{ label: string; value: string; share: number; tone?: VisualTone; focus?: boolean }>;
  caption: string;
}

export interface TrackStep extends StepBase {
  type: 'track';
  points: Array<{ pos: number; label: string; sub?: string; active?: boolean }>;
  caption: string;
}

export interface CompareStep extends StepBase {
  type: 'compare';
  left: { title: string; body: string; tone?: VisualTone };
  right: { title: string; body: string; tone?: VisualTone };
  vs: string;
  focusSide?: 'left' | 'right';
}

export interface FlowStep extends StepBase {
  type: 'flow';
  nodes: Array<{ text: string; tag?: string; tone?: VisualTone; focus?: boolean }>;
}

export interface EliminateStep extends StepBase {
  type: 'eliminate';
  items: Array<{ label: string; text: string; verdict: 'keep' | 'drop'; reason: string }>;
}

export interface ResultStep extends StepBase {
  type: 'result';
  answer: string;
  summary: string;
  trap: string;
}

export type DeckStep =
  | HighlightStep
  | ToggleStep
  | MirrorStep
  | BarStep
  | TrackStep
  | CompareStep
  | FlowStep
  | EliminateStep
  | ResultStep;

export interface LessonDeckVisual {
  kind: 'deck';
  steps: DeckStep[];
}

export type LessonVisual = LessonDeckVisual;

const TONES = new Set<VisualTone>(['indigo', 'teal', 'amber', 'coral', 'muted']);
const MOODS = new Set<EyeMood>(['focus', 'hack', 'alert', 'done']);

function isRec(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function reqStr(v: unknown, label: string): string {
  if (typeof v !== 'string' || !v.trim()) throw new Error(`${label} zorunlu metin olmalı.`);
  return v.trim();
}

function optStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function optTone(v: unknown): VisualTone | undefined {
  return typeof v === 'string' && TONES.has(v as VisualTone) ? (v as VisualTone) : undefined;
}

function optMood(v: unknown): EyeMood | undefined {
  return typeof v === 'string' && MOODS.has(v as EyeMood) ? (v as EyeMood) : undefined;
}

function reqPair(v: unknown, label: string): [string, string] {
  if (!Array.isArray(v) || v.length !== 2) throw new Error(`${label} tam 2 öğe olmalı.`);
  return [reqStr(v[0], `${label}[0]`), reqStr(v[1], `${label}[1]`)];
}

function parseStep(raw: unknown, label: string): DeckStep {
  if (!isRec(raw)) throw new Error(`${label} nesne olmalı.`);
  const type = reqStr(raw.type, `${label}.type`);
  const base: StepBase = {
    cue: reqStr(raw.cue, `${label}.cue`),
    badge: optStr(raw.badge),
    mood: optMood(raw.mood),
  };

  if (type === 'highlight') {
    return {
      ...base,
      type: 'highlight',
      quote: reqStr(raw.quote, `${label}.quote`),
      focus: reqStr(raw.focus, `${label}.focus`),
      note: reqStr(raw.note, `${label}.note`),
    };
  }
  if (type === 'toggle') {
    const rule = reqStr(raw.rule, `${label}.rule`);
    if (rule !== 'implies' && rule !== 'or' && rule !== 'and') {
      throw new Error(`${label}.rule geçersiz: ${rule}`);
    }
    const initRaw = Array.isArray(raw.init) && raw.init.length === 2 ? raw.init : [1, 0];
    const init: [0 | 1, 0 | 1] = [Number(initRaw[0]) === 1 ? 1 : 0, Number(initRaw[1]) === 1 ? 1 : 0];
    return {
      ...base,
      type: 'toggle',
      op: reqStr(raw.op, `${label}.op`),
      rule,
      leftLabel: reqStr(raw.leftLabel, `${label}.leftLabel`),
      leftStates: reqPair(raw.leftStates, `${label}.leftStates`),
      rightLabel: reqStr(raw.rightLabel, `${label}.rightLabel`),
      rightStates: reqPair(raw.rightStates, `${label}.rightStates`),
      init,
      okTag: reqStr(raw.okTag, `${label}.okTag`),
      zeroTag: reqStr(raw.zeroTag, `${label}.zeroTag`),
    };
  }
  if (type === 'mirror') {
    if (!Array.isArray(raw.pairs) || raw.pairs.length < 1 || raw.pairs.length > 3) {
      throw new Error(`${label}.pairs 1-3 öğe olmalı.`);
    }
    return {
      ...base,
      type: 'mirror',
      symbol: reqStr(raw.symbol, `${label}.symbol`),
      pairs: raw.pairs.map((p, i) => {
        if (!isRec(p)) throw new Error(`${label}.pairs[${i}] nesne olmalı.`);
        return {
          from: reqStr(p.from, `${label}.pairs[${i}].from`),
          to: reqStr(p.to, `${label}.pairs[${i}].to`),
          note: reqStr(p.note, `${label}.pairs[${i}].note`),
        };
      }),
    };
  }
  if (type === 'bar') {
    if (!Array.isArray(raw.segments) || raw.segments.length < 2 || raw.segments.length > 4) {
      throw new Error(`${label}.segments 2-4 dilim olmalı.`);
    }
    return {
      ...base,
      type: 'bar',
      totalLabel: reqStr(raw.totalLabel, `${label}.totalLabel`),
      segments: raw.segments.map((s, i) => {
        if (!isRec(s)) throw new Error(`${label}.segments[${i}] nesne olmalı.`);
        const share = Number(s.share);
        if (!Number.isFinite(share) || share <= 0) throw new Error(`${label}.segments[${i}].share pozitif sayı olmalı.`);
        return {
          label: reqStr(s.label, `${label}.segments[${i}].label`),
          value: reqStr(s.value, `${label}.segments[${i}].value`),
          share,
          tone: optTone(s.tone),
          focus: Boolean(s.focus),
        };
      }),
      caption: reqStr(raw.caption, `${label}.caption`),
    };
  }
  if (type === 'track') {
    if (!Array.isArray(raw.points) || raw.points.length < 2 || raw.points.length > 4) {
      throw new Error(`${label}.points 2-4 nokta olmalı.`);
    }
    return {
      ...base,
      type: 'track',
      points: raw.points.map((pt, i) => {
        if (!isRec(pt)) throw new Error(`${label}.points[${i}] nesne olmalı.`);
        const pos = Math.max(0, Math.min(100, Number(pt.pos)));
        if (!Number.isFinite(pos)) throw new Error(`${label}.points[${i}].pos sayı olmalı.`);
        return {
          pos,
          label: reqStr(pt.label, `${label}.points[${i}].label`),
          sub: optStr(pt.sub),
          active: Boolean(pt.active),
        };
      }),
      caption: reqStr(raw.caption, `${label}.caption`),
    };
  }
  if (type === 'compare') {
    if (!isRec(raw.left) || !isRec(raw.right)) throw new Error(`${label}: left ve right nesne olmalı.`);
    return {
      ...base,
      type: 'compare',
      left: { title: reqStr(raw.left.title, `${label}.left.title`), body: reqStr(raw.left.body, `${label}.left.body`), tone: optTone(raw.left.tone) },
      right: { title: reqStr(raw.right.title, `${label}.right.title`), body: reqStr(raw.right.body, `${label}.right.body`), tone: optTone(raw.right.tone) },
      vs: optStr(raw.vs) || 'vs',
      focusSide: raw.focusSide === 'left' || raw.focusSide === 'right' ? raw.focusSide : 'right',
    };
  }
  if (type === 'flow') {
    if (!Array.isArray(raw.nodes) || raw.nodes.length < 2 || raw.nodes.length > 4) {
      throw new Error(`${label}.nodes 2-4 düğüm olmalı.`);
    }
    return {
      ...base,
      type: 'flow',
      nodes: raw.nodes.map((n, i) => {
        if (!isRec(n)) throw new Error(`${label}.nodes[${i}] nesne olmalı.`);
        return {
          text: reqStr(n.text, `${label}.nodes[${i}].text`),
          tag: optStr(n.tag),
          tone: optTone(n.tone),
          focus: Boolean(n.focus),
        };
      }),
    };
  }
  if (type === 'eliminate') {
    if (!Array.isArray(raw.items) || raw.items.length < 2 || raw.items.length > 4) {
      throw new Error(`${label}.items 2-4 öğe olmalı.`);
    }
    return {
      ...base,
      type: 'eliminate',
      items: raw.items.map((it, i) => {
        if (!isRec(it)) throw new Error(`${label}.items[${i}] nesne olmalı.`);
        const verdict = it.verdict === 'keep' ? 'keep' : it.verdict === 'drop' ? 'drop' : null;
        if (!verdict) throw new Error(`${label}.items[${i}].verdict keep veya drop olmalı.`);
        return {
          label: reqStr(it.label, `${label}.items[${i}].label`),
          text: reqStr(it.text, `${label}.items[${i}].text`),
          verdict,
          reason: reqStr(it.reason, `${label}.items[${i}].reason`),
        };
      }),
    };
  }
  if (type === 'result') {
    return {
      ...base,
      type: 'result',
      answer: reqStr(raw.answer, `${label}.answer`),
      summary: reqStr(raw.summary, `${label}.summary`),
      trap: reqStr(raw.trap, `${label}.trap`),
    };
  }
  throw new Error(`${label}: bilinmeyen adım türü (${type}).`);
}

export function parseLessonVisual(value: unknown, label: string): LessonVisual | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRec(value) || value.kind !== 'deck') {
    throw new Error(`${label}: geçersiz görsel deste türü.`);
  }
  if (!Array.isArray(value.steps) || value.steps.length < 2 || value.steps.length > 6) {
    throw new Error(`${label}.steps 2 ile 6 arasında adım içermeli.`);
  }
  return {
    kind: 'deck',
    steps: value.steps.map((step, idx) => parseStep(step, `${label}.steps[${idx}]`)),
  };
}
