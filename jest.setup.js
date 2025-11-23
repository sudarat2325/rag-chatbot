/* eslint-env node, jest */
/* global require, process, global, jest, console */
// Jest setup file
require('@testing-library/jest-dom');

// Mock environment variables
process.env.DATABASE_URL = 'mongodb://localhost:27017/fooddelivery-test?replicaSet=rs0';
process.env.ANTHROPIC_API_KEY = 'test-api-key';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock fetch globally
global.fetch = jest.fn();

// Silence console errors during tests
const originalConsole = global.console;
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: originalConsole.log,
};
