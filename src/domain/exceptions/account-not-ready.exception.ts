import { DomainException } from '@common/exceptions/domain.exception';

export class AccountNotReadyException extends DomainException {
  constructor() {
    super('Account is inactive or email is not verified.', 'ACCOUNT_NOT_READY');
  }
}
