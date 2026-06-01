/**
 * DomainException is the base class for business-rule errors.
 *
 * The domain layer should not depend directly on HTTP statuses because domain
 * errors can be used outside the API layer. For that reason, the exception only
 * carries a message and a business code. ApiExceptionFilter maps the business
 * code to the appropriate HTTP response.
 */
export abstract class DomainException extends Error {
  /**
   * message is the readable error text, while code is the stable mapping/client code.
   *
   * this.name is set to the subclass name so logs and debugging show the
   * specific exception, such as UserNotFoundException instead of only Error.
   */
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
