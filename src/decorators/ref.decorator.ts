export interface RefMetadata {
  classRef: () => Promise<unknown>;
  methodName: string;
  targetMethodName?: string;
}

// Internal storage for @Ref metadata
const refMetadataStore = new WeakMap<object, RefMetadata[]>();

/**
 * Decorator for dynamic class resolution. Marks a method to be resolved from a referenced class.
 * @param classRef - A function that returns the class to be used for implementation.
 *                   Can be synchronous or asynchronous (for dynamic imports).
 * @param targetMethodName - Optional name of the method to call in the referenced class.
 *                           If not provided, uses the same name as the decorated method.
 * @example
 * ```typescript
 * import { MyImplementation } from './my-implementation';
 *
 * class MyService {
 *   // Uses the same method name 'myMethod' in MyImplementation
 *   @Ref(() => MyImplementation)
 *   myMethod(input: string): Promise<string> {
 *     throw new Error('Not implemented');
 *   }
 *
 *   // Calls 'execute' method in MyImplementation
 *   @Ref(() => MyImplementation, 'execute')
 *   anotherMethod(input: string): Promise<string> {
 *     throw new Error('Not implemented');
 *   }
 *
 *   // With dynamic import
 *   @Ref(async () => (await import('./my-impl')).MyImplementation)
 *   asyncMethod(input: string): Promise<string> {
 *     throw new Error('Not implemented');
 *   }
 * }
 * ```
 */
export function Ref(
  classRef: () => Promise<unknown>,
  targetMethodName?: string
) {
  return function (
    target: object,
    propertyKey: string,
    _descriptor?: PropertyDescriptor
  ) {
    const existingRefs = refMetadataStore.get(target) || [];

    existingRefs.push({
      classRef,
      methodName: propertyKey,
      targetMethodName,
    });

    refMetadataStore.set(target, existingRefs);
  };
}

/**
 * Gets all @Ref metadata from a target object
 */
export function getRefMetadata(target: object): RefMetadata[] {
  return refMetadataStore.get(target) || [];
}
