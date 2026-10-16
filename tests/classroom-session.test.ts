import test from 'node:test';
import assert from 'node:assert/strict';
import { roomService } from '../src/features/classroom/room-service.ts';
import { calculateStudentRank } from '../src/features/classroom/ranking.ts';

test('roomService: Oda oluşturma ve katılımcı durumu', () => {
  roomService.joinOrCreateRoom('12-A', 'Hasan Hoca', true);
  const state = roomService.getState();

  assert.equal(state.roomId, '12-A');
  assert.equal(state.userName, 'Hasan Hoca');
  assert.equal(state.isHost, true);
  assert.equal(state.participants.length, 1);
  assert.equal(state.participants[0].name, 'Hasan Hoca');

  roomService.leaveRoom();
  const leftState = roomService.getState();
  assert.equal(leftState.roomId, null);
  assert.equal(leftState.participants.length, 0);
});

test('roomService: Akış olayları (feedItems) ve el kaldırma kaydı', () => {
  roomService.joinOrCreateRoom('FEN-101', 'Zeynep Hoca', true);
  
  // Odak kaybı bildirimi
  roomService.notifyFocusLost();
  let state = roomService.getState();
  assert.equal(state.feedItems.some(f => f.type === 'FOCUS_LOST'), true);

  // Geri dönme bildirimi: ayrılma kaydına returnedAt eklenir
  roomService.notifyFocusRestored();
  state = roomService.getState();
  const lostItem = state.feedItems.find(f => f.type === 'FOCUS_LOST');
  assert.equal(typeof lostItem?.returnedAt, 'number');

  // Hoca çağırma bildirimi
  roomService.callTeacherHelp();
  state = roomService.getState();
  assert.equal(state.helpRequested, true);
  assert.equal(state.feedItems.some(f => f.type === 'HELP_CALL'), true);

  // Hoca çağrıyı çözer
  const helpItem = state.feedItems.find(f => f.type === 'HELP_CALL');
  if (helpItem) {
    roomService.resolveTeacherHelp(helpItem.id, 'Zeynep Hoca');
    state = roomService.getState();
    assert.equal(state.helpRequested, false);
    assert.equal(helpItem.resolved, true);
  }

  roomService.leaveRoom();
});

test('roomService: Duraklatma (Pause) modu durumu günceller', () => {
  roomService.joinOrCreateRoom('FIZ-1', 'Ahmet Hoca', true);
  assert.equal(roomService.getState().isPaused, false);

  roomService.togglePauseRoom();
  assert.equal(roomService.getState().isPaused, true);

  roomService.togglePauseRoom();
  assert.equal(roomService.getState().isPaused, false);

  roomService.leaveRoom();
});

test('calculateStudentRank: Öğrenci sıralamasını doğru hesaplar', () => {
  const now = Date.now();
  const stats = {
    p1: { id: 'p1', name: 'Ali', correctCount: 10, incorrectCount: 1, joinedAt: now - 60000 },
    p2: { id: 'p2', name: 'Ayşe', correctCount: 15, incorrectCount: 0, joinedAt: now - 60000 },
    p3: { id: 'p3', name: 'Mehmet', correctCount: 5, incorrectCount: 5, joinedAt: now - 60000 },
  };

  const ayseRank = calculateStudentRank('Ayşe', stats);
  assert.equal(ayseRank.rank, 1);
  assert.equal(ayseRank.total, 3);

  const aliRank = calculateStudentRank('Ali', stats);
  assert.equal(aliRank.rank, 2);

  const mehmetRank = calculateStudentRank('Mehmet', stats);
  assert.equal(mehmetRank.rank, 3);
});
