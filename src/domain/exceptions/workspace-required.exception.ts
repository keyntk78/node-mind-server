import { DomainException } from '@common/exceptions/domain.exception';

export class WorkspaceRequiredException extends DomainException {
  constructor() {
    super('User has no active workspace.', 'WORKSPACE_REQUIRED');
  }
}
