import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DIContainer } from '../container.di';
import { Logger } from '../logging/logger';
import { Ref } from '../decorators/ref.decorator';
import { SimpleProxy } from './simple-proxy';
import { SubClass } from './simple-proxy-get-user';

describe('DIContainer with @Ref', () => {
  beforeEach(() => {
    // Disable Logger for tests
    vi.spyOn(Logger, 'error').mockImplementation(() => {});
  });

  it('SHOULD auto-match method name WHEN using @Ref without targetMethodName', async () => {
    const container = new DIContainer();
    container.register(SimpleProxy);
    container.register(SubClass);

    const instance = container.resolve<SimpleProxy>(SimpleProxy);
    expect(instance).toBeTruthy();

    const result = await instance.readSub('test');
    expect(result).toBe('Auto: test');
  });

  it('SHOULD use custom method name WHEN targetMethodName is provided', async () => {
    class SubClass {
      public static DEPS = [];
      async read(input: string): Promise<string> {
        return `Value: ${input}`;
      }
    }

    class MainClass {
      public static DEPS = [];

      @Ref(() => SubClass, 'read')
      public readSub(_input: string): Promise<string> {
        throw new Error('Not implemented');
      }
    }

    const container = new DIContainer();
    container.register(MainClass);

    const instance = container.resolve<MainClass>(MainClass);
    expect(instance).toBeTruthy();

    const result = await instance.readSub('test');
    expect(result).toBe('Value: test');
  });
});
