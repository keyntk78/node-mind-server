import type {
  ProfileRepository,
  RoleRepository,
  SessionRepository,
  UserRepository,
  WorkspaceRepository,
} from '@domain/interfaces';

export const AUTH_VERIFICATION_UNIT_OF_WORK = Symbol(
  'AUTH_VERIFICATION_UNIT_OF_WORK',
);

export type AuthVerificationTransaction = {
  userRepository: UserRepository;
  profileRepository: ProfileRepository;
  workspaceRepository: WorkspaceRepository;
  roleRepository: RoleRepository;
  sessionRepository: SessionRepository;
};

export interface AuthVerificationUnitOfWork {
  run<T>(
    work: (transaction: AuthVerificationTransaction) => Promise<T>,
  ): Promise<T>;
}
