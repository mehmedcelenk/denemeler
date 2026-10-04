import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcAction,
  calcCurrent,
  calcMode,
  calcOp,
  calcPrevious,
  resetCalculatorState,
  toggleCalcMode,
} from '../src/features/calculator/calculator.js';

test('Hesap makinesi temel 4 işlem hesaplamaları', () => {
  resetCalculatorState();

  // 12 + 8 = 20
  calcAction('num', '1');
  calcAction('num', '2');
  assert.equal(calcCurrent, '12');

  calcAction('op', '+');
  assert.equal(calcPrevious, '12');
  assert.equal(calcOp, '+');

  calcAction('num', '8');
  assert.equal(calcCurrent, '8');

  calcAction('equals');
  assert.equal(calcCurrent, '20');

  // Çıkarma: 20 - 5 = 15
  calcAction('op', '-');
  calcAction('num', '5');
  calcAction('equals');
  assert.equal(calcCurrent, '15');

  // Çarpma: 15 * 3 = 45
  calcAction('op', '*');
  calcAction('num', '3');
  calcAction('equals');
  assert.equal(calcCurrent, '45');

  // Bölme: 45 / 9 = 5
  calcAction('op', '/');
  calcAction('num', '9');
  calcAction('equals');
  assert.equal(calcCurrent, '5');
});

test('Hesap makinesi sıfıra bölme hatası ve temizleme', () => {
  resetCalculatorState();

  calcAction('num', '9');
  calcAction('op', '/');
  calcAction('num', '0');
  calcAction('equals');
  assert.equal(calcCurrent, 'Hata');

  // Clear işlemi sıfırlar
  calcAction('clear');
  assert.equal(calcCurrent, '0');
  assert.equal(calcPrevious, null);
  assert.equal(calcOp, null);
});

test('Hesap makinesi özel fonksiyonlar: karekök, yüzde, işaret, geri silme', () => {
  resetCalculatorState();

  // Karekök: sqrt(64) = 8
  calcAction('num', '6');
  calcAction('num', '4');
  calcAction('sqrt');
  assert.equal(calcCurrent, '8');

  // Negatif karekök hatası
  calcAction('negate');
  assert.equal(calcCurrent, '-8');
  calcAction('sqrt');
  assert.equal(calcCurrent, 'Hata');

  // Yüzde: 50 -> 0.5
  calcAction('clear');
  calcAction('num', '5');
  calcAction('num', '0');
  calcAction('percent');
  assert.equal(calcCurrent, '0.5');

  // Geri silme (Backspace)
  calcAction('clear');
  calcAction('num', '1');
  calcAction('num', '2');
  calcAction('num', '3');
  assert.equal(calcCurrent, '123');
  calcAction('backspace');
  assert.equal(calcCurrent, '12');

  // Virgül / Ondalık
  calcAction('dot');
  calcAction('num', '5');
  assert.equal(calcCurrent, '12.5');
});

test('Hesap makinesi mod geçişi (num ve ops)', () => {
  resetCalculatorState();
  assert.equal(calcMode, 'num');

  toggleCalcMode();
  assert.equal(calcMode, 'ops');

  toggleCalcMode();
  assert.equal(calcMode, 'num');
});

