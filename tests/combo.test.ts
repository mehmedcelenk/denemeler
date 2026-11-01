import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCombo, type ComboState } from '../src/shared/combo.ts';

test('Combo mantığı: 1. doğru sessiz, 2 ile 5 arası doğal unvanlarla ilerler', () => {
  let s: ComboState = { currentStreak: 0, hasGrace: false };

  // 1. doğru
  const r1 = evaluateCombo(s, true);
  s = r1.nextState;
  assert.equal(s.currentStreak, 1);
  assert.equal(r1.event, null, '1. doğruda toast çıkmamalı');

  const r2 = evaluateCombo(s, true);
  s = r2.nextState;
  assert.equal(s.currentStreak, 2);
  assert.equal(r2.event?.title, 'Temiz başlangıç');
  assert.equal(r2.event?.subtitle, "2'de 2");
  assert.equal(r2.event?.badgeClass, 'combo-water');

  const r3 = evaluateCombo(s, true);
  s = r3.nextState;
  assert.equal(s.currentStreak, 3);
  assert.equal(r3.event?.title, 'Aynen böyle');

  const r4 = evaluateCombo(s, true); s = r4.nextState;
  assert.equal(r4.event?.title, 'Gözünden kaçmıyor');
  const r5 = evaluateCombo(s, true); s = r5.nextState;
  assert.equal(r5.event?.title, 'Üstad');
});

test('Combo mantığı: 6 ve üzerinde Durdurulamıyor veya Maşallah der', () => {
  const s5: ComboState = { currentStreak: 5, hasGrace: false };

  const rUnstoppable = evaluateCombo(s5, true, () => 0.2);
  assert.equal(rUnstoppable.nextState.currentStreak, 6);
  assert.equal(rUnstoppable.event?.title, 'Durdurulamıyor');

  const rCount = evaluateCombo(s5, true, () => 0.8);
  assert.equal(rCount.nextState.currentStreak, 6);
  assert.equal(rCount.event?.title, 'Maşallah');
});

test('Combo mantığı: Serideyken yanlış yapınca kalkansız "Avans Verdi" (toprak tonu) olur', () => {
  const s: ComboState = { currentStreak: 4, hasGrace: false };

  // Yanlış cevap -> Avans Verdi
  const r = evaluateCombo(s, false);
  assert.equal(r.nextState.currentStreak, 4);
  assert.equal(r.nextState.hasGrace, true);
  assert.equal(r.event?.type, 'grace_given');
  assert.equal(r.event?.title, 'Avans Verdi', 'Kalkan emojisi olmamalı');
  assert.equal(r.event?.badgeClass, 'combo-earth');
});

test('Combo mantığı: "Avans Verdi" sonrasında yeni unvanlardan biriyle devam eder', () => {
  const s: ComboState = { currentStreak: 5, hasGrace: true };

  const rDevam = evaluateCombo(s, true, () => 0.8);
  assert.equal(rDevam.nextState.currentStreak, 6);
  assert.equal(rDevam.nextState.hasGrace, false);
  assert.equal(rDevam.event?.title, 'Maşallah');

  const rDurdur = evaluateCombo(s, true, () => 0.2);
  assert.equal(rDurdur.nextState.currentStreak, 6);
  assert.equal(rDurdur.event?.title, 'Durdurulamıyor');
});

test('Combo mantığı: "Avans Verdi"den sonra tekrar bilemezse "Buraya Kadar" olur ve seri sıfırlanır', () => {
  const s: ComboState = { currentStreak: 5, hasGrace: true };

  const r = evaluateCombo(s, false);
  assert.equal(r.nextState.currentStreak, 0);
  assert.equal(r.nextState.hasGrace, false);
  assert.equal(r.event?.type, 'broken');
  assert.match(r.event!.title, /Buraya Kadar/);
  assert.equal(r.event?.badgeClass, 'combo-broken');
});
