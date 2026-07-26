import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { server } from './server';

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Clean up after the tests are finished.
afterAll(() => server.close());

// Mock browser APIs or globals that JSDOM doesn't implement
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

global.scrollTo = global.scrollTo || function() {};

// Mock window.location to prevent JSDOM navigation failures
const mockLocation = new URL('http://localhost');
mockLocation.assign = vi.fn();
mockLocation.replace = vi.fn();
mockLocation.reload = vi.fn();

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});
