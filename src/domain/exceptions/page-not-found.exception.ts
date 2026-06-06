import { DomainException } from '@common/exceptions/domain.exception';

export class PageNotFoundException extends DomainException {
  constructor(message = 'Parent page not found.') {
    super(message, 'PAGE_NOT_FOUND');
  }
}
