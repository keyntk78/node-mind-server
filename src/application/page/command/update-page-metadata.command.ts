export class UpdatePageMetadataCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly title: string | undefined,
    public readonly icon: string | null | undefined,
    public readonly coverUrl: string | null | undefined,
  ) {}
}
