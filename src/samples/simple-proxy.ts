import { RefFacade } from '../ref-facade.interface';
import { Ref } from '../decorators/ref.decorator';

export class SimpleProxy implements RefFacade {
  public static readonly DEPS = [];

  @Ref(
    async () => (await import('./simple-proxy-get-user'))['SubClass'],
    'readSub'
  )
  public readSub(_input: string): Promise<string> {
    throw new Error(
      'Method not implemented - should be resolved via @Ref decorator'
    );
  }
}
