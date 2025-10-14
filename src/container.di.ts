import { Logger } from './logging/logger';

type Constructor<T> = new (...args: never[]) => T;

type Class = {
  DEPS: unknown[];
};

export class DIContainer {
  private readonly services = new Map<
    Constructor<unknown> | Class | symbol,
    unknown
  >();

  registerMock<T>(
    constructor: Constructor<T> | Constructor<unknown> | symbol,
    val: unknown = undefined as never
  ) {
    if (!Array.isArray((constructor as unknown as Class)?.DEPS)) {
      throw new Error('Class has no static property DEPS');
    }

    this.services.set(constructor, val);
  }

  register<T>(
    constructor: Constructor<T> | Constructor<unknown> | symbol,
    val: unknown = undefined as never
  ) {
    if (typeof (constructor as unknown) === 'symbol') {
      this.services.set(constructor, val);
      return;
    }

    if (!Array.isArray((constructor as unknown as Class)?.DEPS)) {
      throw new Error('Class has no static property DEPS');
    }

    this.services.set(constructor, constructor);
  }

  resolve<T>(
    constructor: Constructor<unknown> | symbol,
    useMocked = false,
    isFirstExecution = true
  ): T {
    if (
      this.services.has(constructor) &&
      typeof (constructor as unknown) === 'symbol'
    ) {
      return this.services.get(constructor) as T;
    }

    if (!this.services.has(constructor)) {
      if (isFirstExecution) {
        return null as T;
      }
      this.services.set(constructor, constructor);
    }

    const service = this.services.get(constructor);

    if (!service) {
      return null as T;
    }

    if (!isFirstExecution && useMocked) {
      return service as T;
    }

    const params =
      (service as Class)?.DEPS?.map((param: unknown) =>
        this.resolve(param as Constructor<unknown> | symbol, useMocked, false)
      ) ?? [];

    try {
      return new (service as Constructor<T>)(...(params as never[]));
    } catch (err) {
      Logger.error(`Missed: ${String(service)}`, {
        serviceStringify: JSON.stringify(service),
        params,
        service,
        err,
      });
      // TODO: requieres to implement a way to identify the service name that throws the error
      throw new Error(`Unable to resolve service: ${JSON.stringify(service)}`);
    }
  }

  clear() {
    // Clear all registered services
    this.services.clear();
  }
}
