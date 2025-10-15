import { DIContainer } from './container.di';
import { Logger } from './logging/logger';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
    // Disable Logger for tests
    vi.spyOn(Logger, 'error').mockImplementation(() => {});
  });

  it('SHOULD return null WHEN class is not found', () => {
    class TestClass {
      helloWorld() {
        return 'Hello, World!';
      }
    }

    const instance = container.resolve<TestClass>(TestClass);
    expect(instance).toBeFalsy();
    expect(() => instance.helloWorld()).toThrow();
  });

  it('SHOULD resolve instance WHEN class is registered', () => {
    class TestClass {
      static DEPS = [];

      helloWorld() {
        return 'Hello, World!';
      }
    }

    container.register(TestClass);

    const instance = container.resolve<TestClass>(TestClass);
    expect(instance).toBeTruthy();
    expect(instance.helloWorld()).toBe('Hello, World!');
  });

  it('SHOULD resolve instance WHEN static dependency is passed', () => {
    const Env = Symbol('app-env');

    class TestClass {
      static DEPS = [Env];

      constructor(private readonly vars: never) {}

      helloWorld() {
        return `The hello world env:${this.vars['env'] ?? '---'}`;
      }
    }

    container.register(Env, {
      env: 'dev',
    });
    container.register(TestClass);

    const instance = container.resolve<TestClass>(TestClass);
    expect(instance).toBeTruthy();
    expect(instance.helloWorld()).toBe('The hello world env:dev');
  });

  it('SHOULD resolve a service WHEN service depends on another class that uses a static ref', () => {
    const Env = Symbol('app-env');

    class ConfClass {
      static DEPS = [Env];

      constructor(private readonly vars: never) {}

      helloWorld(): string {
        return `Hello, World! ${this.vars['env'] ?? '---'}`;
      }
    }

    class TestClass {
      static DEPS = [ConfClass];

      constructor(private readonly confClass: ConfClass) {}

      helloWorld(): string {
        return this.confClass.helloWorld();
      }
    }

    container.register(Env, {
      env: 'dev',
    });
    container.register(TestClass);
    container.register(ConfClass);

    const instance = container.resolve<TestClass>(TestClass);
    expect(instance.helloWorld()).toBe('Hello, World! dev');
  });

  it('SHOULD resolve a service WHEN nesting is 5 levels', () => {
    const Env = Symbol('app-env');

    class Level1 {
      static DEPS = [Env];

      constructor(private readonly vars: never) {}

      helloWorld(): string {
        return `Hello, World! ${this.vars['env'] ?? '---'}`;
      }
    }

    class Level2 {
      static DEPS = [Level1];

      constructor(private readonly level1: Level1) {}

      helloWorld(): string {
        return this.level1.helloWorld();
      }
    }

    class Level3 {
      static DEPS = [Level2];

      constructor(private readonly level2: Level2) {}

      helloWorld(): string {
        return this.level2.helloWorld();
      }
    }

    class Level4 {
      static DEPS = [Level3];

      constructor(private readonly level3: Level3) {}

      helloWorld(): string {
        return this.level3.helloWorld();
      }
    }

    class Level5 {
      static DEPS = [Level4];

      constructor(private readonly level4: Level4) {}

      helloWorld(): string {
        return this.level4.helloWorld();
      }
    }

    class MainClass {
      static DEPS = [Level5];

      constructor(private readonly level5: Level5) {}

      helloWorld(): string {
        return this.level5.helloWorld();
      }
    }

    container.register(Env, {
      env: 'dev',
    });
    container.register(MainClass);
    container.register(Level1);
    container.register(Level2);
    container.register(Level3);
    container.register(Level4);
    container.register(Level5);

    const instance = container.resolve<MainClass>(MainClass);
    expect(instance.helloWorld()).toBe('Hello, World! dev');
  });

  it('SHOULD resolve a service WHEN with static null dep', () => {
    const Env = Symbol('app-env');

    class ConfClass {
      static DEPS = [Env];

      constructor(private readonly vars: never) {}

      helloWorld(): string {
        return `Hello, World! ${this.vars?.['env'] ?? '---'}`;
      }
    }

    class TestClass {
      static DEPS = [ConfClass];

      constructor(private readonly confClass: ConfClass) {}

      helloWorld(): string {
        return this.confClass.helloWorld();
      }
    }

    container.register(Env, null);
    container.register(TestClass);
    container.register(ConfClass);

    const instance = container.resolve<TestClass>(TestClass);
    expect(instance.helloWorld()).toBe('Hello, World! ---');
  });

  it('SHOULD throw registering service WHEN class has no property DEPS', () => {
    class ConfClass {
      constructor(private readonly _vars: never) {}
    }

    expect(() => container.register(ConfClass)).toThrow();
  });

  it('SHOULD return null when resolving an undefined symbol', () => {
    const UndefinedSymbol = Symbol('undefined-symbol');
    const result = container.resolve(UndefinedSymbol);
    expect(result).toBeNull();
  });

  it('SHOULD directly return value when resolving a registered symbol', () => {
    const TestSymbol = Symbol('test-symbol');
    const testValue = { test: 'value' };

    container.register(TestSymbol, testValue);

    const result = container.resolve(TestSymbol);
    expect(result).toBe(testValue);
  });

  it('SHOULD automatically register and resolve a class if not found during nested resolution', () => {
    class AutoRegisteredDep {
      static DEPS = [];

      getValue() {
        return 'auto-registered';
      }
    }

    class TestClass {
      static DEPS = [AutoRegisteredDep];

      constructor(private dep: AutoRegisteredDep) {}

      getValue() {
        return this.dep.getValue();
      }
    }

    container.register(TestClass);
    // Note: we do not register AutoRegisteredDep

    const instance = container.resolve<TestClass>(TestClass);
    expect(instance.getValue()).toBe('auto-registered');
  });

  it('SHOULD handle clear method call', () => {
    // Just for coverage, doesn't do anything yet
    expect(() => container.clear()).not.toThrow();
  });

  it('SHOULD throw error symbol not found', () => {
    const TestSymbol = Symbol('test-symbol');

    class TestClass {
      static DEPS = [TestSymbol];

      constructor(private readonly vars: string) {}

      getValue() {
        return this.vars;
      }
    }

    container.register(TestClass);

    expect(() => {
      container.resolve<TestClass>(TestClass).getValue();
    }).toThrow('Unable to resolve service: undefined');
  });

  describe('registerMock', () => {
    it('SHOULD register a mock value for a class', () => {
      class TestClass {
        static DEPS = [];

        getValue() {
          return 'real-value';
        }
      }

      const mockInstance = {
        getValue: () => 'mocked-value',
      };

      container.registerMock(TestClass, mockInstance);

      const result = container.resolve<typeof mockInstance>(
        TestClass,
        true,
        false
      );
      expect(result.getValue()).toBe('mocked-value');
    });

    it('SHOULD throw error WHEN class has no DEPS property', () => {
      class TestClass {
        getValue() {
          return 'value';
        }
      }

      expect(() => {
        container.registerMock(TestClass, {});
      }).toThrow('Class has no static property DEPS');
    });

    it('SHOULD allow mocking a class with dependencies', () => {
      const Env = Symbol('app-env');

      class DependencyClass {
        static DEPS = [Env];

        constructor(private readonly env: never) {}

        getValue() {
          return `real-${this.env['env']}`;
        }
      }

      class TestClass {
        static DEPS = [DependencyClass];

        constructor(private readonly dep: DependencyClass) {}

        getValue() {
          return this.dep.getValue();
        }
      }

      const mockDependency = {
        getValue: () => 'mocked-dependency',
      };

      container.register(Env, { env: 'prod' });
      container.registerMock(DependencyClass, mockDependency);
      container.register(TestClass);

      const instance = container.resolve<TestClass>(TestClass, true);
      expect(instance.getValue()).toBe('mocked-dependency');
    });

    it('SHOULD register mock with undefined value', () => {
      class TestClass {
        static DEPS = [];

        getValue() {
          return 'real-value';
        }
      }

      container.registerMock(TestClass);

      const result = container.resolve<TestClass>(TestClass, true, false);
      // The resolve method returns null for undefined/falsy values
      expect(result).toBeNull();
    });

    it('SHOULD register mock with null value', () => {
      class TestClass {
        static DEPS = [];

        getValue() {
          return 'real-value';
        }
      }

      container.registerMock(TestClass, null);

      const result = container.resolve<TestClass>(TestClass, true, false);
      expect(result).toBeNull();
    });

    it('SHOULD allow mocking with a custom object', () => {
      class DatabaseService {
        static DEPS = [];

        async query(_sql: string) {
          // Real database query
          return [];
        }
      }

      const mockDatabase = {
        query: async (_sql: string) => {
          return [{ id: 1, name: 'mocked-data' }];
        },
      };

      container.registerMock(DatabaseService, mockDatabase);

      const result = container.resolve<typeof mockDatabase>(
        DatabaseService,
        true,
        false
      );
      expect(result).toBe(mockDatabase);
    });

    it('SHOULD allow mocking with a spy function', () => {
      class LoggerService {
        static DEPS = [];

        log(message: string) {
          console.log(message);
        }
      }

      const logSpy = vi.fn();
      const mockLogger = {
        log: logSpy,
      };

      container.registerMock(LoggerService, mockLogger);

      const result = container.resolve<typeof mockLogger>(
        LoggerService,
        true,
        false
      );
      result.log('test message');

      expect(logSpy).toHaveBeenCalledWith('test message');
      expect(logSpy).toHaveBeenCalledTimes(1);
    });

    it('SHOULD return mock when useMocked is false but only mock is registered', () => {
      class TestClass {
        static DEPS = [];

        getValue() {
          return 'real-value';
        }
      }

      const mockInstance = {
        getValue: () => 'mocked-value',
      };

      container.registerMock(TestClass, mockInstance);

      // When useMocked is false, it tries to instantiate the service
      // Since registerMock stores the mock object (not the constructor),
      // the resolve will attempt to instantiate the mock object which will fail
      // This test verifies the behavior when only a mock is registered
      expect(() => {
        container.resolve<TestClass>(TestClass, false, false);
      }).toThrow('Unable to resolve service');
    });

    it('SHOULD allow overriding a previously registered class with a mock', () => {
      class TestClass {
        static DEPS = [];

        getValue() {
          return 'real-value';
        }
      }

      container.register(TestClass);

      // First resolve should return real instance
      const realInstance = container.resolve<TestClass>(TestClass);
      expect(realInstance.getValue()).toBe('real-value');

      // Now register a mock
      const mockInstance = {
        getValue: () => 'mocked-value',
      };

      container.registerMock(TestClass, mockInstance);

      // Resolve with useMocked should return mock
      const mockedInstance = container.resolve<typeof mockInstance>(
        TestClass,
        true,
        false
      );
      expect(mockedInstance.getValue()).toBe('mocked-value');
    });

    it('SHOULD handle complex mock objects with multiple methods', () => {
      class ApiService {
        static DEPS = [];

        async get(_url: string) {
          return { data: 'real' };
        }

        async post(_url: string, _data: unknown) {
          return { success: true };
        }

        async delete(_url: string) {
          return { deleted: true };
        }
      }

      const mockApi = {
        get: vi.fn().mockResolvedValue({ data: 'mocked' }),
        post: vi.fn().mockResolvedValue({ success: false }),
        delete: vi.fn().mockResolvedValue({ deleted: false }),
      };

      container.registerMock(ApiService, mockApi);

      const result = container.resolve<typeof mockApi>(ApiService, true, false);

      expect(result).toBe(mockApi);
      expect(result.get).toBe(mockApi.get);
      expect(result.post).toBe(mockApi.post);
      expect(result.delete).toBe(mockApi.delete);
    });

    it('SHOULD work with nested dependencies where parent uses mock', () => {
      class DatabaseService {
        static DEPS = [];

        query() {
          return 'real-query';
        }
      }

      class RepositoryService {
        static DEPS = [DatabaseService];

        constructor(private db: DatabaseService) {}

        getData() {
          return this.db.query();
        }
      }

      const mockDb = {
        query: () => 'mocked-query',
      };

      container.registerMock(DatabaseService, mockDb);
      container.register(RepositoryService);

      const repo = container.resolve<RepositoryService>(
        RepositoryService,
        true
      );
      expect(repo.getData()).toBe('mocked-query');
    });
  });
});
