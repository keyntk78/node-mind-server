export class GetCurrentAuthContextQuery {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
  ) {}
}
