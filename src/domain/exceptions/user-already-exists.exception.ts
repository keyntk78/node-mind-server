import { DomainException } from '@common/exceptions/domain.exception';

export class UserAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`User with email ${email} already exists.`, 'USER_ALREADY_EXISTS');
  }
}
