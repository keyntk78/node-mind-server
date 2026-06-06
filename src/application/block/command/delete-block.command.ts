export class DeleteBlockCommand {
  constructor(
    public readonly userId: string,
    public readonly blockId: string,
  ) {}
}
