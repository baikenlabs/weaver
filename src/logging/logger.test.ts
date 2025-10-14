import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from './logger';

describe('Logger', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('error', () => {
    it('SHOULD log error message without context', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const message = 'Test error message';

      Logger.error(message);

      expect(consoleErrorSpy).toHaveBeenCalledWith(message, '');
      consoleErrorSpy.mockRestore();
    });

    it('SHOULD log error message with context', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const message = 'Test error with context';
      const context = { userId: '123', action: 'delete' };

      Logger.error(message, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        message,
        JSON.stringify(context, null, 2)
      );
      consoleErrorSpy.mockRestore();
    });

    it('SHOULD log error message with complex context object', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const message = 'Complex error';
      const context = {
        user: { id: '123', name: 'John' },
        timestamp: new Date('2024-01-01'),
        metadata: { source: 'api', version: '1.0' },
      };

      Logger.error(message, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        message,
        JSON.stringify(context, null, 2)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('warn', () => {
    it('SHOULD log warning message without context', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const message = 'Test warning message';

      Logger.warn(message);

      expect(consoleWarnSpy).toHaveBeenCalledWith(message, '');
      consoleWarnSpy.mockRestore();
    });

    it('SHOULD log warning message with context', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const message = 'Test warning with context';
      const context = { threshold: 80, current: 90 };

      Logger.warn(message, context);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        message,
        JSON.stringify(context, null, 2)
      );
      consoleWarnSpy.mockRestore();
    });

    it('SHOULD log warning message with empty context object', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const message = 'Warning with empty context';
      const context = {};

      Logger.warn(message, context);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        message,
        JSON.stringify(context, null, 2)
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('info', () => {
    it('SHOULD log info message without context', () => {
      const consoleInfoSpy = vi
        .spyOn(console, 'info')
        .mockImplementation(() => {});
      const message = 'Test info message';

      Logger.info(message);

      expect(consoleInfoSpy).toHaveBeenCalledWith(message, '');
      consoleInfoSpy.mockRestore();
    });

    it('SHOULD log info message with context', () => {
      const consoleInfoSpy = vi
        .spyOn(console, 'info')
        .mockImplementation(() => {});
      const message = 'User action';
      const context = { action: 'login', userId: 'user-456' };

      Logger.info(message, context);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        message,
        JSON.stringify(context, null, 2)
      );
      consoleInfoSpy.mockRestore();
    });

    it('SHOULD log info message with array in context', () => {
      const consoleInfoSpy = vi
        .spyOn(console, 'info')
        .mockImplementation(() => {});
      const message = 'Processing items';
      const context = { items: ['item1', 'item2', 'item3'], count: 3 };

      Logger.info(message, context);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        message,
        JSON.stringify(context, null, 2)
      );
      consoleInfoSpy.mockRestore();
    });
  });

  describe('debug', () => {
    it('SHOULD log debug message without context', () => {
      const consoleDebugSpy = vi
        .spyOn(console, 'debug')
        .mockImplementation(() => {});
      const message = 'Test debug message';

      Logger.debug(message);

      expect(consoleDebugSpy).toHaveBeenCalledWith(message, '');
      consoleDebugSpy.mockRestore();
    });

    it('SHOULD log debug message with context', () => {
      const consoleDebugSpy = vi
        .spyOn(console, 'debug')
        .mockImplementation(() => {});
      const message = 'Debug details';
      const context = { step: 'validation', data: { value: 42 } };

      Logger.debug(message, context);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        message,
        JSON.stringify(context, null, 2)
      );
      consoleDebugSpy.mockRestore();
    });

    it('SHOULD log debug message with null values in context', () => {
      const consoleDebugSpy = vi
        .spyOn(console, 'debug')
        .mockImplementation(() => {});
      const message = 'Debug with null';
      const context = { value: null, optional: undefined };

      Logger.debug(message, context);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        message,
        JSON.stringify(context, null, 2)
      );
      consoleDebugSpy.mockRestore();
    });
  });

  describe('context formatting', () => {
    it('SHOULD format context with proper indentation', () => {
      const consoleInfoSpy = vi
        .spyOn(console, 'info')
        .mockImplementation(() => {});
      const message = 'Formatting test';
      const context = { nested: { level1: { level2: 'value' } } };

      Logger.info(message, context);

      const expectedJson = JSON.stringify(context, null, 2);
      expect(consoleInfoSpy).toHaveBeenCalledWith(message, expectedJson);
      expect(expectedJson).toContain('\n'); // Should have newlines for formatting
      consoleInfoSpy.mockRestore();
    });

    it('SHOULD handle special characters in context', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const message = 'Special chars';
      const context = { message: 'Hello "World"', path: '/user/test' };

      Logger.error(message, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        message,
        JSON.stringify(context, null, 2)
      );
      consoleErrorSpy.mockRestore();
    });

    it('SHOULD handle numeric values in context', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const message = 'Numeric context';
      const context = { count: 100, percentage: 85.5, zero: 0 };

      Logger.warn(message, context);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        message,
        JSON.stringify(context, null, 2)
      );
      consoleWarnSpy.mockRestore();
    });

    it('SHOULD handle boolean values in context', () => {
      const consoleDebugSpy = vi
        .spyOn(console, 'debug')
        .mockImplementation(() => {});
      const message = 'Boolean context';
      const context = { isActive: true, isDeleted: false };

      Logger.debug(message, context);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        message,
        JSON.stringify(context, null, 2)
      );
      consoleDebugSpy.mockRestore();
    });
  });

  describe('all log levels', () => {
    it('SHOULD use different console methods for different log levels', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const consoleInfoSpy = vi
        .spyOn(console, 'info')
        .mockImplementation(() => {});
      const consoleDebugSpy = vi
        .spyOn(console, 'debug')
        .mockImplementation(() => {});

      const message = 'Test message';
      const context = { test: true };

      Logger.error(message, context);
      Logger.warn(message, context);
      Logger.info(message, context);
      Logger.debug(message, context);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleInfoSpy.mockRestore();
      consoleDebugSpy.mockRestore();
    });
  });
});
