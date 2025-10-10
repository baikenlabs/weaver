import { Logger } from './logging/logger';
import { getRefMetadata } from './decorators/ref.decorator';

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
      const instance = new (service as Constructor<T>)(...(params as never[]));

      // Check if the instance has @Ref decorated methods
      // Get metadata from the prototype, not the instance
      const prototype = Object.getPrototypeOf(instance);
      const refMetadata = getRefMetadata(prototype);

      if (refMetadata.length > 0) {
        return this.createProxyWithRefs(
          instance,
          refMetadata,
          constructor as Constructor<T>
        );
      }

      return instance;
    } catch (err) {
      const errorText =
        typeof service === 'string' ? service : JSON.stringify(service);
      Logger.error(`Missed: ${errorText}`, {
        serviceStringify: JSON.stringify(service),
        params,
        service,
        err,
      });
      // TODO: requieres to implement a way to identify the service name that throws the error
      throw new Error(`Unable to resolve service: ${JSON.stringify(service)}`);
    }
  }

  private createProxyWithRefs<T>(
    instance: T,
    refMetadata: ReturnType<typeof getRefMetadata>,
    _constructor: Constructor<T>
  ): T {
    const refMethodsMap = new Map(
      refMetadata.map((ref) => [ref.methodName, ref])
    );

    return new Proxy(instance as object, {
      get: (target, prop: string | symbol) => {
        if (typeof prop === 'string' && refMethodsMap.has(prop)) {
          return async (...args: unknown[]) => {
            const refConfig = refMethodsMap.get(prop)!;
            const classRefFn = refConfig.classRef;

            try {
              // Get the referenced class (support both sync and async)
              const classRefResult = classRefFn();
              const ReferencedClass =
                classRefResult instanceof Promise
                  ? await classRefResult
                  : classRefResult;

              if (!ReferencedClass) {
                throw new Error(
                  `No class returned from @Ref for method ${prop}`
                );
              }

              // Resolve the instance from the DI container
              // Use isFirstExecution=false to enable auto-registration
              const refInstance: never = this.resolve(
                ReferencedClass as Constructor<unknown>,
                false,
                false
              );

              // Use targetMethodName if provided, otherwise use the decorated method name
              const methodName = refConfig.targetMethodName || prop;

              if (typeof refInstance[methodName] !== 'function') {
                throw new Error(
                  `Method ${methodName} not found in referenced class`
                );
              }

              return (
                refInstance[methodName] as (...args: unknown[]) => unknown
              )(...args);
            } catch (err) {
              Logger.error(`Failed to resolve @Ref method: ${prop}`, {
                error: err,
              });
              throw err;
            }
          };
        }

        return target[prop as keyof typeof target];
      },
    }) as T;
  }

  clear() {
    // Clear all registered services
    this.services.clear();
  }
}
