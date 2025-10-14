import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProxyFactory } from './proxy-facade';
import { DIContainer } from './container.di';
import { Command } from './command';
import { WEAVER_REGISTRY } from './vars';
import { Logger } from './logging/logger';

describe('ProxyFactory', () => {
  let container: DIContainer;
  let proxyFactory: ProxyFactory;

  // Create a concrete implementation of the abstract ProxyFactory class
  class ConcreteProxyFactory extends ProxyFactory {}

  beforeEach(() => {
    container = new DIContainer();
    // Disable Logger for tests
    vi.spyOn(Logger, 'error').mockImplementation(() => {});

    // Register the container as WEAVER_REGISTRY
    container.register(WEAVER_REGISTRY, container);

    // Register the concrete ProxyFactory implementation
    container.register(ConcreteProxyFactory);

    // Resolve ProxyFactory instance
    proxyFactory =
      container.resolve<ConcreteProxyFactory>(ConcreteProxyFactory);
  });

  describe('DEPS Configuration', () => {
    it('SHOULD have WEAVER_REGISTRY as dependency', () => {
      expect(ProxyFactory.DEPS).toEqual([WEAVER_REGISTRY]);
    });
  });

  describe('Basic Command Execution', () => {
    it('SHOULD execute a simple command through the factory', async () => {
      class SimpleCommand implements Command<string, string> {
        static readonly DEPS = [];

        async execute(input: string): Promise<string> {
          return `Processed: ${input}`;
        }
      }

      container.register(SimpleCommand);

      const result = await proxyFactory.execute(
        SimpleCommand as never,
        'test-input'
      );

      expect(result).toBe('Processed: test-input');
    });

    it('SHOULD execute command with number types', async () => {
      class DoubleCommand implements Command<number, number> {
        static readonly DEPS = [];

        async execute(input: number): Promise<number> {
          return input * 2;
        }
      }

      container.register(DoubleCommand);

      const result = await proxyFactory.execute(DoubleCommand as never, 42);

      expect(result).toBe(84);
    });

    it('SHOULD execute command with object types', async () => {
      interface UserInput {
        name: string;
        age: number;
      }

      interface UserOutput {
        greeting: string;
        isAdult: boolean;
      }

      class ProcessUserCommand implements Command<UserInput, UserOutput> {
        static readonly DEPS = [];

        async execute(input: UserInput): Promise<UserOutput> {
          return {
            greeting: `Hello, ${input.name}!`,
            isAdult: input.age >= 18,
          };
        }
      }

      container.register(ProcessUserCommand);

      const result = await proxyFactory.execute<
        UserInput,
        UserOutput,
        ProcessUserCommand
      >(ProcessUserCommand as never, {
        name: 'Alice',
        age: 25,
      });

      expect(result.greeting).toBe('Hello, Alice!');
      expect(result.isAdult).toBe(true);
    });
  });

  describe('Command Resolution', () => {
    it('SHOULD resolve and execute command from DI container', async () => {
      class CounterCommand implements Command<number, number> {
        static readonly DEPS = [];
        private count = 0;

        async execute(input: number): Promise<number> {
          this.count += input;
          return this.count;
        }
      }

      container.register(CounterCommand);

      const result1 = await proxyFactory.execute(CounterCommand as never, 10);
      const result2 = await proxyFactory.execute(CounterCommand as never, 5);

      // The container reuses the same instance
      expect(result1).toBe(10);
      expect(result2).toBe(5); // Each execution is independent as count resets
    });

    it('SHOULD execute command with dependencies', async () => {
      class DependencyService {
        static readonly DEPS = [];

        getValue(): string {
          return 'dependency-value';
        }
      }

      class CommandWithDeps implements Command<string, string> {
        static readonly DEPS = [DependencyService];

        constructor(private readonly service: DependencyService) {}

        async execute(input: string): Promise<string> {
          return `${input}-${this.service.getValue()}`;
        }
      }

      container.register(DependencyService);
      container.register(CommandWithDeps);

      const result = await proxyFactory.execute(
        CommandWithDeps as never,
        'test'
      );

      expect(result).toBe('test-dependency-value');
    });
  });

  describe('Error Handling', () => {
    it('SHOULD propagate errors from command execution', async () => {
      class ErrorCommand implements Command<string, string> {
        static readonly DEPS = [];

        async execute(input: string): Promise<string> {
          if (input === 'error') {
            throw new Error('Command execution failed');
          }
          return input;
        }
      }

      container.register(ErrorCommand);

      await expect(
        proxyFactory.execute(ErrorCommand as never, 'error')
      ).rejects.toThrow('Command execution failed');

      await expect(
        proxyFactory.execute(ErrorCommand as never, 'valid')
      ).resolves.toBe('valid');
    });

    it('SHOULD handle command that throws during async operation', async () => {
      class AsyncErrorCommand implements Command<number, number> {
        static readonly DEPS = [];

        async execute(input: number): Promise<number> {
          if (input < 0) {
            throw new Error('Negative number not allowed');
          }
          return input * 2;
        }
      }

      container.register(AsyncErrorCommand);

      await expect(
        proxyFactory.execute(AsyncErrorCommand as never, -5)
      ).rejects.toThrow('Negative number not allowed');

      await expect(
        proxyFactory.execute(AsyncErrorCommand as never, 5)
      ).resolves.toBe(10);
    });
  });

  describe('Multiple Command Types', () => {
    it('SHOULD execute different command types through same factory', async () => {
      class Command1 implements Command<string, string> {
        static readonly DEPS = [];

        async execute(input: string): Promise<string> {
          return `Command1: ${input}`;
        }
      }

      class Command2 implements Command<number, number> {
        static readonly DEPS = [];

        async execute(input: number): Promise<number> {
          return input + 100;
        }
      }

      container.register(Command1);
      container.register(Command2);

      const result1 = await proxyFactory.execute(Command1 as never, 'test');
      const result2 = await proxyFactory.execute(Command2 as never, 50);

      expect(result1).toBe('Command1: test');
      expect(result2).toBe(150);
    });
  });

  describe('Complex Scenarios', () => {
    it('SHOULD execute command that depends on another service', async () => {
      class ConfigService {
        static readonly DEPS = [];

        getPrefix(): string {
          return 'PREFIX';
        }
      }

      class FormatterCommand implements Command<string, string> {
        static readonly DEPS = [ConfigService];

        constructor(private readonly config: ConfigService) {}

        async execute(input: string): Promise<string> {
          return `${this.config.getPrefix()}: ${input.toUpperCase()}`;
        }
      }

      container.register(ConfigService);
      container.register(FormatterCommand);

      const result = await proxyFactory.execute(
        FormatterCommand as never,
        'hello'
      );

      expect(result).toBe('PREFIX: HELLO');
    });

    it('SHOULD handle command with nested dependencies', async () => {
      class BaseService {
        static readonly DEPS = [];

        getBase(): string {
          return 'base';
        }
      }

      class MiddleService {
        static readonly DEPS = [BaseService];

        constructor(private readonly base: BaseService) {}

        getMiddle(): string {
          return `${this.base.getBase()}-middle`;
        }
      }

      class ComplexCommand implements Command<string, string> {
        static readonly DEPS = [MiddleService];

        constructor(private readonly middle: MiddleService) {}

        async execute(input: string): Promise<string> {
          return `${this.middle.getMiddle()}-${input}`;
        }
      }

      container.register(BaseService);
      container.register(MiddleService);
      container.register(ComplexCommand);

      const result = await proxyFactory.execute(ComplexCommand as never, 'end');

      expect(result).toBe('base-middle-end');
    });

    it('SHOULD execute command with array input', async () => {
      class SumCommand implements Command<number[], number> {
        static readonly DEPS = [];

        async execute(input: number[]): Promise<number> {
          return input.reduce((sum, num) => sum + num, 0);
        }
      }

      container.register(SumCommand);

      const result = await proxyFactory.execute(
        SumCommand as never,
        [1, 2, 3, 4, 5]
      );

      expect(result).toBe(15);
    });

    it('SHOULD execute command with void return type', async () => {
      class VoidCommand implements Command<string, void> {
        static readonly DEPS = [];
        lastInput = '';

        async execute(input: string): Promise<void> {
          this.lastInput = input;
        }
      }

      container.register(VoidCommand);

      const result = await proxyFactory.execute(VoidCommand as never, 'test');

      expect(result).toBeUndefined();
    });
  });

  describe('Integration with Container', () => {
    it('SHOULD use the injected DI container for resolution', async () => {
      class TestCommand implements Command<string, string> {
        static readonly DEPS = [];

        async execute(input: string): Promise<string> {
          return `Executed: ${input}`;
        }
      }

      container.register(TestCommand);

      const result = await proxyFactory.execute(TestCommand as never, 'test');

      expect(result).toBe('Executed: test');
    });

    it('SHOULD work with multiple ProxyFactory instances', async () => {
      // Create another concrete implementation
      class ConcreteProxyFactory2 extends ProxyFactory {}

      const container2 = new DIContainer();
      container2.register(WEAVER_REGISTRY, container2);
      container2.register(ConcreteProxyFactory2);

      const factory2 = container2.resolve<ConcreteProxyFactory2>(
        ConcreteProxyFactory2
      );

      class Command1 implements Command<string, string> {
        static readonly DEPS = [];

        async execute(input: string): Promise<string> {
          return `Factory1: ${input}`;
        }
      }

      class Command2 implements Command<string, string> {
        static readonly DEPS = [];

        async execute(input: string): Promise<string> {
          return `Factory2: ${input}`;
        }
      }

      container.register(Command1);
      container2.register(Command2);

      const result1 = await proxyFactory.execute(Command1 as never, 'test');
      const result2 = await factory2.execute(Command2 as never, 'test');

      expect(result1).toBe('Factory1: test');
      expect(result2).toBe('Factory2: test');
    });
  });
});
