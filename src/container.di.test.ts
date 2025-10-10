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
});
