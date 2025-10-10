import { describe, expect, it, beforeEach, vi } from 'vitest';
import { DIContainer } from '../container.di';
import { SimpleProxy } from '../samples/simple-proxy';
import { SubClass } from '../samples/simple-proxy-get-user';
import { Logger } from '../logging/logger';
import { Ref } from './ref.decorator';

describe('Ref Decorator', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
    // Disable Logger for tests
    vi.spyOn(Logger, 'error').mockImplementation(() => {});
  });

  it('SHOULD use same method name by default WHEN no targetMethodName provided', async () => {
    class TestImpl {
      static DEPS = [];

      async myMethod(input: string): Promise<string> {
        return `Auto-matched: ${input}`;
      }
    }

    class TestService {
      static DEPS = [];

      @Ref(() => TestImpl)
      myMethod(_input: string): Promise<string> {
        throw new Error('Not implemented');
      }
    }

    container.register(TestService);

    const instance = container.resolve<TestService>(TestService);
    const result = await instance.myMethod('test');

    expect(result).toBe('Auto-matched: test');
  });

  it('SHOULD use custom method name WHEN targetMethodName is provided', async () => {
    class TestImpl {
      static DEPS = [];

      async customExecute(input: string): Promise<string> {
        return `Custom: ${input}`;
      }
    }

    class TestService {
      static DEPS = [];

      @Ref(() => TestImpl, 'customExecute')
      myMethod(_input: string): Promise<string> {
        throw new Error('Not implemented');
      }
    }

    container.register(TestService);

    const instance = container.resolve<TestService>(TestService);
    const result = await instance.myMethod('test');

    expect(result).toBe('Custom: test');
  });

  it('SHOULD handle multiple calls to @Ref decorated method', async () => {
    class TestImpl {
      static DEPS = [];

      async process(input: string): Promise<string> {
        return `Processed: ${input}`;
      }
    }

    class TestService {
      static DEPS = [];

      @Ref(() => TestImpl, 'process')
      myMethod(_input: string): Promise<string> {
        throw new Error('Not implemented');
      }
    }

    container.register(TestService);

    const instance = container.resolve<TestService>(TestService);

    const result1 = await instance.myMethod('first');
    const result2 = await instance.myMethod('second');

    expect(result1).toBe('Processed: first');
    expect(result2).toBe('Processed: second');
  });

  it('SHOULD resolve with DI dependencies in referenced class', async () => {
    // This tests that the referenced class (SubClass) can also have DEPS
    container.register(SimpleProxy);

    const instance = container.resolve<SimpleProxy>(SimpleProxy);

    expect(instance).toBeTruthy();

    const result = await instance.readSub('dependency-test');

    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('SHOULD work with async imports in SimpleProxy example', async () => {
    container.register(SimpleProxy);
    container.register(SubClass);

    const instance = container.resolve<SimpleProxy>(SimpleProxy);

    // This should use the auto-matched 'readSub' method
    const result = await instance.readSub('test-input');

    expect(result).toBe('Auto: test-input');
  });
});
