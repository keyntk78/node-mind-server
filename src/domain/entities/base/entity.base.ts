/**
 * EntityBase — Base class for all Domain Entities
 *
 * In DDD, entities are compared by identity (ID), not by value.
 */
export abstract class EntityBase<TId = string> {
  constructor(public readonly id: TId) {}

  equals(other: EntityBase<TId>): boolean {
    if (!other) return false;
    if (this === other) return true;
    return this.id === other.id;
  }
}
