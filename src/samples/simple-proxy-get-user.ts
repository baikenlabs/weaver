import { SimpleProxy } from './simple-proxy';

export class SubClass {
  public static readonly DEPS = [];

  // Method with custom name (for backward compatibility)
  async read(
    input: Parameters<SimpleProxy['readSub']>[0]
  ): ReturnType<SimpleProxy['readSub']> {
    return `Value: ${input}`;
  }

  // Method with the same name as the decorated method
  async readSub(
    input: Parameters<SimpleProxy['readSub']>[0]
  ): ReturnType<SimpleProxy['readSub']> {
    return `Auto: ${input}`;
  }
}
