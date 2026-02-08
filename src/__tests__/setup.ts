// ============================================
// 🧪 TEST SETUP - Vitest Configuration
// ============================================

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock as Storage;

// Mock sessionStorage
global.sessionStorage = localStorageMock as Storage;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock SpeechRecognition
(window as any).SpeechRecognition = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

// Mock AudioContext
(window as any).AudioContext = vi.fn().mockImplementation(() => ({
  createMediaStreamSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
  }),
  createAnalyser: vi.fn().mockReturnValue({
    fftSize: 0,
    frequencyBinCount: 128,
    getByteFrequencyData: vi.fn(),
    getFloatTimeDomainData: vi.fn(),
  }),
  createGain: vi.fn().mockReturnValue({
    gain: { value: 1 },
    connect: vi.fn(),
  }),
  createBufferSource: vi.fn().mockReturnValue({
    buffer: null,
    playbackRate: { value: 1 },
    connect: vi.fn(),
    start: vi.fn(),
    onended: null,
  }),
  decodeAudioData: vi.fn(),
  destination: {},
  close: vi.fn(),
}));
