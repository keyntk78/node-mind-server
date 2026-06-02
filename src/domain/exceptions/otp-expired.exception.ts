import { DomainException } from '@common/exceptions/domain.exception';

export class OtpExpiredException extends DomainException {
  constructor() {
    super('OTP is invalid or expired.', 'OTP_EXPIRED');
  }
}
 