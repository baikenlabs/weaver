import { ProxyFactory } from '../../proxy-facade';

export class SimpleProxy {
  public static readonly DEPS = [ProxyFactory];

  constructor(private readonly proxyFactory: ProxyFactory) {}

  public async readSub(input: string): Promise<string> {
    return this.proxyFactory.execute<string, string>(
      (await import('./simple-proxy-get-user')).SubClass,
      input
    );
  }
}
