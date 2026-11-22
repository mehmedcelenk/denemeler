import test from 'node:test';
import assert from 'node:assert/strict';
import { setAuthMode } from '../src/features/welcome/auth-modal.ts';

test('opening auth does not steal focus back after the user moves to the password', () => {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const originalFrame = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  const frames: FrameRequestCallback[] = [];
  let focused = '';
  const email = { placeholder: '', focus: () => { focused = 'email'; } };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    getElementById: (id: string) => id === 'authEmailInput' ? email : null,
  } });
  Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true,
    value: (callback: FrameRequestCallback) => frames.push(callback),
  });
  try {
    setAuthMode('signin');
    focused = 'password'; // User tabs to the next field before the next frame.
    for (const callback of frames) callback(0);
    assert.equal(focused, 'password');
  } finally {
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else delete (globalThis as { document?: Document }).document;
    if (originalFrame) Object.defineProperty(globalThis, 'requestAnimationFrame', originalFrame);
    else delete (globalThis as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame;
  }
});
