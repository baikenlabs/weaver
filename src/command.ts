export interface Command<TI, TO> {
  execute(input: TI): Promise<TO>;
}
