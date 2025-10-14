import { SimpleProxy } from './simple-proxy';
import { Command } from '../../command';

export class SubClass implements Command<string, string> {
  public static readonly DEPS = [];

  async execute(
    input: Parameters<SimpleProxy['readSub']>[0]
  ): ReturnType<SimpleProxy['readSub']> {
    return `Value from execute: ${input}`;
  }
}
