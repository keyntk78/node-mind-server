export type ReorderBlockItem = {
  id: string;
  orderIndex: number;
};

export class ReorderBlocksCommand {
  constructor(
    public readonly userId: string,
    public readonly pageId: string,
    public readonly blocks: ReorderBlockItem[],
  ) {}
}
