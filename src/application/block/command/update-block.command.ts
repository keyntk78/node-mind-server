export class UpdateBlockCommand {
  constructor(
    public readonly userId: string,
    public readonly blockId: string,
    public readonly content: Record<string, unknown>,
  ) {}
}
