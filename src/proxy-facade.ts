import { WEAVER_REGISTRY } from './vars';
import { DIContainer } from './container.di';
import { Command } from './command';

export class ProxyFactory {
  public static readonly DEPS = [WEAVER_REGISTRY];

  constructor(private readonly diContainer: DIContainer) {}

  async execute<TI, TO, T = Command<TI, TO>>(
    clazz: new (...args: never[]) => T,
    input: TI
  ): Promise<TO> {
    return (await this.diContainer
      .resolve<Command<unknown, unknown>>(clazz as never)
      .execute(input)) as TO;
  }
}
