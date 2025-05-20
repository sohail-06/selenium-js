// This file contains setup configurations that run before all tests

// Increase the default timeout for all tests since we're dealing with browser automation
jest.setTimeout(30000);

// Add custom jest matchers if needed
expect.extend({
  // Add custom matchers here if needed in the future
});

// Global setup that runs before all tests
beforeAll(() => {
  // Global setup if needed
});

// Global teardown that runs after all tests
afterAll(() => {
  // Global cleanup if needed
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});
