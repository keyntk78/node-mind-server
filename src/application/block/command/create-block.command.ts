export class CreateBlockCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly type: string,
    public readonly content: Record<string, unknown>,
    public readonly orderIndex: number | undefined,
  ) {}
}
