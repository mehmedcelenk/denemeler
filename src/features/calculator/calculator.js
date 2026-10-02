

export let isCalcOpen = false;

export let calcMode = 'num';

export let calcCurrent = '0';

export let calcPrevious = null;

export let calcOp = null;

export let calcResetOnNext = false;

export function toggleMiniCalculator() {
  if (typeof document === 'undefined') return;
  const calc = document.getElementById('miniCalcWidget');
  if (!calc) return;
  isCalcOpen = !isCalcOpen;
  calc.style.display = isCalcOpen ? 'flex' : 'none';
  if (isCalcOpen) {
    calcMode = 'num';
    renderCalcKeypad();
    updateCalcDisplay();
    const popup = document.getElementById('consoleMenuPopup');
    if (popup) popup.classList.remove('open');
  }
}

export function toggleCalcMode() {
  calcMode = (calcMode === 'num') ? 'ops' : 'num';
  renderCalcKeypad();
}

export function renderCalcKeypad() {
  if (typeof document === 'undefined') return;
  const grid = document.getElementById('miniCalcGrid');
  const widget = document.getElementById('miniCalcWidget');
  if (!grid) return;

  if (!grid.querySelector('.mini-calc-panel-num')) {
    grid.innerHTML = `
      <div class="mini-calc-panel mini-calc-panel-num" id="calcPanelNum">
        <button type="button" class="micro-calc-btn" onclick="calcAction('num', '7')">7</button>
        <button type="button" class="micro-calc-btn" onclick="calcAction('num', '8')">8</button>
        <button type="button" class="micro-calc-btn" onclick="calcAction('num', '9')">9</button>
        
        <button type="button" class="micro-calc-btn" onclick="calcAction('num', '4')">4</button>
        <button type="button" class="micro-calc-btn" onclick="calcAction('num', '5')">5</button>
        <button type="button" class="micro-calc-btn" onclick="calcAction('num', '6')">6</button>
        
        <button type="button" class="micro-calc-btn" onclick="calcAction('num', '1')">1</button>
        <button type="button" class="micro-calc-btn" onclick="calcAction('num', '2')">2</button>
        <button type="button" class="micro-calc-btn" onclick="calcAction('num', '3')">3</button>
        
        <button type="button" class="micro-calc-btn micro-calc-btn-zero" onclick="calcAction('num', '0')">0</button>
        <button type="button" class="micro-calc-btn" onclick="calcAction('dot')">,</button>
        <button type="button" class="micro-calc-btn micro-btn-change" onclick="toggleCalcMode()" title="İşlemler">⇄</button>
      </div>
      <div class="mini-calc-panel mini-calc-panel-ops" id="calcPanelOps">
        <button type="button" class="micro-calc-btn micro-btn-op" data-op="+" onclick="calcAction('op', '+')">+</button>
        <button type="button" class="micro-calc-btn micro-btn-op" data-op="-" onclick="calcAction('op', '-')">−</button>
        <button type="button" class="micro-calc-btn micro-btn-op" data-op="*" onclick="calcAction('op', '*')">×</button>
        
        <button type="button" class="micro-calc-btn micro-btn-op" data-op="/" onclick="calcAction('op', '/')">÷</button>
        <button type="button" class="micro-calc-btn micro-btn-op" onclick="calcAction('sqrt')" title="Karekök">√</button>
        <button type="button" class="micro-calc-btn micro-btn-op" onclick="calcAction('percent')" title="Yüzde">%</button>
        
        <button type="button" class="micro-calc-btn" onclick="calcAction('negate')" title="Artı/Eksi">±</button>
        <button type="button" class="micro-calc-btn" onclick="calcAction('backspace')" title="Geri Sil">⌫</button>
        <button type="button" class="micro-calc-btn" onclick="calcAction('clear')" title="Temizle">C</button>
        
        <button type="button" class="micro-calc-btn micro-btn-equals" onclick="calcAction('equals')" title="Eşittir">=</button>
        <button type="button" class="micro-calc-btn micro-btn-close" onclick="toggleMiniCalculator()" title="Kapat">✕</button>
        <button type="button" class="micro-calc-btn micro-btn-change" onclick="toggleCalcMode()" title="Rakamlara Dön">⇄</button>
      </div>
    `;
  }

  if (widget) {
    widget.classList.toggle('calc-mode-num', calcMode === 'num');
    widget.classList.toggle('calc-mode-ops', calcMode === 'ops');
  }
}

export function updateCalcDisplay() {
  if (typeof document === 'undefined') return;
  const main = document.getElementById('calcMainDisplay');
  const sub = document.getElementById('calcSubDisplay');
  if (main) main.textContent = calcCurrent;
  if (sub) {
    if (calcPrevious !== null && calcOp) {
      const opSym = { '+': '+', '-': '−', '*': '×', '/': '÷' }[calcOp] || calcOp;
      sub.textContent = `${calcPrevious} ${opSym}`;
    } else {
      sub.textContent = '';
    }
  }

  const opButtons = document.querySelectorAll('.mini-calc-panel-ops .micro-btn-op');
  opButtons.forEach(btn => {
    const op = btn.getAttribute('data-op');
    if (op && op === calcOp && calcPrevious !== null) {
      btn.classList.add('is-active-op');
    } else {
      btn.classList.remove('is-active-op');
    }
  });
}

export function calcAction(type, val) {
  if (type === 'num') {
    if (calcResetOnNext || calcCurrent === '0' || calcCurrent === 'Hata') {
      calcCurrent = val;
      calcResetOnNext = false;
    } else {
      if (calcCurrent.length < 12) calcCurrent += val;
    }
  } else if (type === 'dot') {
    if (calcResetOnNext || calcCurrent === 'Hata') {
      calcCurrent = '0.';
      calcResetOnNext = false;
    } else if (!calcCurrent.includes('.')) {
      calcCurrent += '.';
    }
  } else if (type === 'clear') {
    calcCurrent = '0';
    calcPrevious = null;
    calcOp = null;
    calcResetOnNext = false;
    calcMode = 'num';
    renderCalcKeypad();
  } else if (type === 'backspace') {
    if (!calcResetOnNext && calcCurrent.length > 1 && calcCurrent !== 'Hata') {
      calcCurrent = calcCurrent.slice(0, -1);
    } else {
      calcCurrent = '0';
    }
  } else if (type === 'negate') {
    if (calcCurrent !== '0' && calcCurrent !== 'Hata') {
      calcCurrent = calcCurrent.startsWith('-') ? calcCurrent.slice(1) : '-' + calcCurrent;
    }
  } else if (type === 'percent') {
    const n = parseFloat(calcCurrent);
    if (!isNaN(n)) {
      calcCurrent = String(Number((n / 100).toFixed(6)));
    }
    calcResetOnNext = true;
  } else if (type === 'sqrt') {
    const n = parseFloat(calcCurrent);
    if (isNaN(n) || n < 0) {
      calcCurrent = 'Hata';
    } else {
      calcCurrent = String(Number(Math.sqrt(n).toFixed(6)));
    }
    calcResetOnNext = true;
    calcMode = 'num';
    renderCalcKeypad();
  } else if (type === 'op') {
    if (calcOp && calcPrevious !== null && !calcResetOnNext) {
      calcExecute();
    }
    calcPrevious = calcCurrent;
    calcOp = val;
    calcResetOnNext = true;
    calcMode = 'num';
    renderCalcKeypad();
  } else if (type === 'equals') {
    if (calcOp && calcPrevious !== null) {
      calcExecute();
      calcOp = null;
      calcPrevious = null;
      calcResetOnNext = true;
    }
    calcMode = 'num';
    renderCalcKeypad();
  }
  updateCalcDisplay();
}

export function calcExecute() {
  const a = parseFloat(calcPrevious);
  const b = parseFloat(calcCurrent);
  if (isNaN(a) || isNaN(b)) return;
  let res = 0;
  if (calcOp === '+') res = a + b;
  else if (calcOp === '-') res = a - b;
  else if (calcOp === '*') res = a * b;
  else if (calcOp === '/') {
    if (b === 0) {
      calcCurrent = 'Hata';
      return;
    }
    res = a / b;
  }
  res = Math.round(res * 1000000) / 1000000;
  calcCurrent = String(res);
}

export function resetCalculatorState() {
  isCalcOpen = false;
  calcMode = 'num';
  calcCurrent = '0';
  calcPrevious = null;
  calcOp = null;
  calcResetOnNext = false;
}

export function initDraggableCalculator() {
  if (typeof document === 'undefined') return;
  const calc = document.getElementById('miniCalcWidget');
  const pill = document.getElementById('miniCalcDisplayPill');
  if (!calc || !pill) return;

  renderCalcKeypad();

  let isDragging = false;
  let startX = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;

  function onDragStart(e) {
    if (e.target.closest('.micro-calc-btn')) return;
    isDragging = true;
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    startX = clientX;
    startY = clientY;

    const rect = calc.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    calc.style.right = 'auto';
    calc.style.bottom = 'auto';
    calc.style.left = `${initialLeft}px`;
    calc.style.top = `${initialTop}px`;

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  }

  function onDragMove(e) {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    const maxLeft = window.innerWidth - calc.offsetWidth - 10;
    const maxTop = window.innerHeight - calc.offsetHeight - 10;
    newLeft = Math.max(10, Math.min(newLeft, maxLeft));
    newTop = Math.max(10, Math.min(newTop, maxTop));

    calc.style.left = `${newLeft}px`;
    calc.style.top = `${newTop}px`;
  }

  function onDragEnd() {
    isDragging = false;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);
  }

  pill.addEventListener('mousedown', onDragStart);
  pill.addEventListener('touchstart', onDragStart, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (!isCalcOpen) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.key >= '0' && e.key <= '9') {
      calcAction('num', e.key);
    } else if (e.key === '.' || e.key === ',') {
      calcAction('dot');
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
      calcAction('op', e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      calcAction('equals');
    } else if (e.key === 'Backspace') {
      calcAction('backspace');
    } else if (e.key === 'Escape') {
      toggleMiniCalculator();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      toggleCalcMode();
    } else if (e.key === 'c' || e.key === 'C') {
      calcAction('clear');
    } else if (e.key === '%') {
      calcAction('percent');
    }
  });

  window.addEventListener('resize', () => {
    if (!isCalcOpen || !calc.style.left) return;
    const curLeft = parseFloat(calc.style.left);
    const curTop = parseFloat(calc.style.top);
    const maxLeft = Math.max(10, window.innerWidth - calc.offsetWidth - 10);
    const maxTop = Math.max(10, window.innerHeight - calc.offsetHeight - 10);
    if (curLeft > maxLeft) calc.style.left = `${maxLeft}px`;
    if (curTop > maxTop) calc.style.top = `${maxTop}px`;
  });
}
