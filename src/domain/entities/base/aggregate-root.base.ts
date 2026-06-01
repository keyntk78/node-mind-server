import { DomainEvent } from './domain-event.base';
import { EntityBase } from './entity.base';

/**
 * AggregateRoot — Base class for Aggregate Roots
 *
 * In DDD, an Aggregate Root:
 * - Is the entry point for the entire aggregate
 * - Collects domain events that are dispatched after persistence
 * - Ensures consistency boundaries
 */
export abstract class AggregateRoot<TId = string> extends EntityBase<TId> {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  getDomainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
