export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export class BlockContent {
  private constructor(private readonly value: Record<string, JsonValue>) {}

  static create(value: Record<string, unknown>): BlockContent {
    return new BlockContent(BlockContent.cloneJsonObject(value));
  }

  static empty(): BlockContent {
    return new BlockContent({});
  }

  equals(other: BlockContent): boolean {
    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }

  toPrimitives(): Record<string, JsonValue> {
    return BlockContent.cloneJsonObject(this.value);
  }

  private static cloneJsonObject(
    value: Record<string, unknown>,
  ): Record<string, JsonValue> {
    return JSON.parse(JSON.stringify(value)) as Record<string, JsonValue>;
  }
}
