import { DomainException } from '@common/exceptions/domain.exception';

export class WorkspaceAccessDeniedException extends DomainException {
  constructor() {
    super(
      'You do not have access to this workspace.',
      'WORKSPACE_ACCESS_DENIED',
    );
  }
}
