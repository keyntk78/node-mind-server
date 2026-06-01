/**
 * DomainEvent — Base class for all Domain Events
 *
 * Every event carries the timestamp of when it occurred.
 */
export abstract class DomainEvent {
  public readonly occurredOn: Date;

  constructor() {
    this.occurredOn = new Date();
  }
}
