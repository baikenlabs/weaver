/* global setTimeout */
import { describe, expect, it } from 'vitest';
import { Command } from './command';

describe('Command Interface', () => {
  describe('Basic Implementation', () => {
    it('SHOULD execute with string input and output', async () => {
      class UpperCaseCommand implements Command<string, string> {
        async execute(input: string): Promise<string> {
          return input.toUpperCase();
        }
      }

      const command = new UpperCaseCommand();
      const result = await command.execute('hello');

      expect(result).toBe('HELLO');
    });

    it('SHOULD execute with number input and output', async () => {
      class DoubleCommand implements Command<number, number> {
        async execute(input: number): Promise<number> {
          return input * 2;
        }
      }

      const command = new DoubleCommand();
      const result = await command.execute(5);

      expect(result).toBe(10);
    });

    it('SHOULD execute with object input and output', async () => {
      interface UserInput {
        firstName: string;
        lastName: string;
      }

      interface UserOutput {
        fullName: string;
        initials: string;
      }

      class FormatUserCommand implements Command<UserInput, UserOutput> {
        async execute(input: UserInput): Promise<UserOutput> {
          return {
            fullName: `${input.firstName} ${input.lastName}`,
            initials: `${input.firstName[0]}${input.lastName[0]}`,
          };
        }
      }

      const command = new FormatUserCommand();
      const result = await command.execute({
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result.fullName).toBe('John Doe');
      expect(result.initials).toBe('JD');
    });
  });

  describe('Different Input/Output Types', () => {
    it('SHOULD handle string input with boolean output', async () => {
      class ValidateEmailCommand implements Command<string, boolean> {
        async execute(input: string): Promise<boolean> {
          return input.includes('@') && input.includes('.');
        }
      }

      const command = new ValidateEmailCommand();
      const validResult = await command.execute('test@example.com');
      const invalidResult = await command.execute('invalid-email');

      expect(validResult).toBe(true);
      expect(invalidResult).toBe(false);
    });

    it('SHOULD handle array input with single value output', async () => {
      class SumCommand implements Command<number[], number> {
        async execute(input: number[]): Promise<number> {
          return input.reduce((sum, num) => sum + num, 0);
        }
      }

      const command = new SumCommand();
      const result = await command.execute([1, 2, 3, 4, 5]);

      expect(result).toBe(15);
    });

    it('SHOULD handle void output type', async () => {
      class LogCommand implements Command<string, void> {
        private lastLog: string = '';

        async execute(input: string): Promise<void> {
          this.lastLog = input;
        }

        getLastLog(): string {
          return this.lastLog;
        }
      }

      const command = new LogCommand();
      const result = await command.execute('test log');

      expect(result).toBeUndefined();
      expect(command.getLastLog()).toBe('test log');
    });
  });

  describe('Stateful Commands', () => {
    it('SHOULD maintain state between executions', async () => {
      class CounterCommand implements Command<number, number> {
        private count: number = 0;

        async execute(input: number): Promise<number> {
          this.count += input;
          return this.count;
        }
      }

      const command = new CounterCommand();
      const result1 = await command.execute(5);
      const result2 = await command.execute(3);
      const result3 = await command.execute(2);

      expect(result1).toBe(5);
      expect(result2).toBe(8);
      expect(result3).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('SHOULD propagate errors from execute method', async () => {
      class ErrorCommand implements Command<string, string> {
        async execute(input: string): Promise<string> {
          if (input === 'error') {
            throw new Error('Expected error');
          }
          return input;
        }
      }

      const command = new ErrorCommand();

      await expect(command.execute('error')).rejects.toThrow('Expected error');
      await expect(command.execute('valid')).resolves.toBe('valid');
    });

    it('SHOULD handle async errors', async () => {
      class AsyncErrorCommand implements Command<number, number> {
        async execute(input: number): Promise<number> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          if (input < 0) {
            throw new Error('Negative numbers not allowed');
          }
          return input;
        }
      }

      const command = new AsyncErrorCommand();

      await expect(command.execute(-1)).rejects.toThrow(
        'Negative numbers not allowed'
      );
      await expect(command.execute(5)).resolves.toBe(5);
    });
  });

  describe('Composability', () => {
    it('SHOULD allow chaining multiple commands', async () => {
      class AddCommand implements Command<number, number> {
        constructor(private readonly addValue: number) {}

        async execute(input: number): Promise<number> {
          return input + this.addValue;
        }
      }

      class MultiplyCommand implements Command<number, number> {
        constructor(private readonly multiplier: number) {}

        async execute(input: number): Promise<number> {
          return input * this.multiplier;
        }
      }

      const add10 = new AddCommand(10);
      const multiply2 = new MultiplyCommand(2);

      let result = await add10.execute(5); // 15
      result = await multiply2.execute(result); // 30

      expect(result).toBe(30);
    });

    it('SHOULD allow creating a command pipeline', async () => {
      class CommandPipeline<TI, TO> implements Command<TI, TO> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(private readonly commands: Command<any, any>[]) {}

        async execute(input: TI): Promise<TO> {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let result: any = input;
          for (const command of this.commands) {
            result = await command.execute(result);
          }
          return result;
        }
      }

      class TrimCommand implements Command<string, string> {
        async execute(input: string): Promise<string> {
          return input.trim();
        }
      }

      class UpperCaseCommand implements Command<string, string> {
        async execute(input: string): Promise<string> {
          return input.toUpperCase();
        }
      }

      class AddPrefixCommand implements Command<string, string> {
        async execute(input: string): Promise<string> {
          return `PROCESSED: ${input}`;
        }
      }

      const pipeline = new CommandPipeline<string, string>([
        new TrimCommand(),
        new UpperCaseCommand(),
        new AddPrefixCommand(),
      ]);

      const result = await pipeline.execute('  hello world  ');

      expect(result).toBe('PROCESSED: HELLO WORLD');
    });
  });

  describe('Generic Type Safety', () => {
    it('SHOULD enforce type constraints at compile time', async () => {
      interface TypedInput {
        value: number;
      }

      interface TypedOutput {
        result: string;
      }

      class TypeSafeCommand implements Command<TypedInput, TypedOutput> {
        async execute(input: TypedInput): Promise<TypedOutput> {
          return {
            result: `Value: ${input.value}`,
          };
        }
      }

      const command = new TypeSafeCommand();
      const result = await command.execute({ value: 42 });

      expect(result.result).toBe('Value: 42');
    });
  });

  describe('Async Operations', () => {
    it('SHOULD handle delayed async operations', async () => {
      class DelayedCommand implements Command<string, string> {
        async execute(input: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return `Delayed: ${input}`;
        }
      }

      const command = new DelayedCommand();
      const startTime = Date.now();
      const result = await command.execute('test');
      const endTime = Date.now();

      expect(result).toBe('Delayed: test');
      expect(endTime - startTime).toBeGreaterThanOrEqual(50);
    });

    it('SHOULD handle parallel command execution', async () => {
      class SlowCommand implements Command<number, number> {
        async execute(input: number): Promise<number> {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return input * 2;
        }
      }

      const command = new SlowCommand();
      const startTime = Date.now();

      const results = await Promise.all([
        command.execute(1),
        command.execute(2),
        command.execute(3),
      ]);

      const endTime = Date.now();

      expect(results).toEqual([2, 4, 6]);
      // Should take ~100ms for parallel execution, not ~300ms for sequential
      expect(endTime - startTime).toBeLessThan(200);
    });
  });
});
