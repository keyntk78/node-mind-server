export class GetPageChildrenQuery {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly parentId: string,
    public readonly limit: number,
    public readonly cursor?: string,
  ) {}
}
