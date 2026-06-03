export class CreatePageCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly parentId: string | null,
    public readonly title: string | undefined,
    public readonly icon: string | null | undefined,
  ) {}
}
