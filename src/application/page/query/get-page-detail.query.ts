export class GetPageDetailQuery {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
  ) {}
}
