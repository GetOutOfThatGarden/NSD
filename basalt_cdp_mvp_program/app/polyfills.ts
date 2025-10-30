// Polyfills for Node.js modules in browser environment
import { Buffer } from 'buffer';

// Make Buffer available globally
(globalThis as any).Buffer = Buffer;

// Make global available
if (typeof global === 'undefined') {
  (globalThis as any).global = globalThis;
}

// Make process available
if (typeof process === 'undefined') {
  (globalThis as any).process = {
    env: {},
    version: '',
    platform: 'browser',
    nextTick: (fn: Function) => setTimeout(fn, 0),
  };
}