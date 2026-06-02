import { DomainException } from '@common/exceptions/domain.exception';

export class InvalidRefreshTokenException extends DomainException {
  constructor() {
    super('Invalid refresh token.', 'INVALID_REFRESH_TOKEN');
  }
}
