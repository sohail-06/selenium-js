// This file contains setup configurations that run before all tests
import { jest, expect, beforeAll } from '@jest/globals';

// Increase the default timeout for all tests since we're dealing with browser automation
jest.setTimeout(30000);

// Add global error handlers
beforeAll(() => {
  process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection:', error);
  });
});

// Add custom jest matchers
expect.extend({
  toBeValidationError(received, expected) {
    const pass = received.message.includes(expected);
    return {
      pass,
      message: () => `expected error message ${received.message} ${pass ? 'not ' : ''}to include "${expected}"`
    };
  }
});
