import {
  AUTH_VERIFICATION_UNIT_OF_WORK,
  type AuthVerificationTransaction,
  type AuthVerificationUnitOfWork,
} from '@application/ports/auth-verification-unit-of-work.port';
import { OTP_STORE, type OtpStore } from '@application/ports/otp-store.port';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '@application/ports/token-service.port';
import {
  Role,
  UserRole,
  UserSession,
  UserWorkspace,
  Workspace,
  WorkspaceMembership,
} from '@domain/entities';
import { OtpExpiredException } from '@domain/exceptions';
import { USER_REPOSITORY, type UserRepository } from '@domain/interfaces';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { VerifyEmailCommand } from '../verify-email.command';

@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand> {
  private readonly logger = new Logger(VerifyEmailHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(OTP_STORE)
    private readonly otpStore: OtpStore,
    @Inject(AUTH_VERIFICATION_UNIT_OF_WORK)
    private readonly authVerificationUnitOfWork: AuthVerificationUnitOfWork,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: VerifyEmailCommand) {
    // Step 1: Receive validated email and OTP from VerifyEmailCommand.
    const { email, otp } = command;

    this.logger.log(`[CQRS] VerifyEmailHandler: verifying ${email}`);

    // Step 2: Normalize email before reading Redis or querying the database.
    const normalizedEmail = email.trim().toLowerCase();

    // Step 3: Read OTP from Redis key auth:otp:{email}.
    const storedOtp = await this.otpStore.getVerificationOtp(normalizedEmail);

    // Step 4: Return/throw OTP_EXPIRED when OTP is missing or mismatched.
    if (!storedOtp || storedOtp !== otp) {
      throw new OtpExpiredException();
    }
    // Step 5: Find user by normalized email.
    const user = await this.userRepository.findByEmail(normalizedEmail);

    // Step 6: Return/throw OTP_EXPIRED when user does not exist or is already verified.
    if (!user || user.isVerified) {
      // Delete OTP from Redis to prevent brute-force attempts even if user is already verified or does not exist.
      await this.otpStore.deleteVerificationOtp(normalizedEmail);
      throw new OtpExpiredException();
    }

    // Step 7: Use AuthVerificationUnitOfWork to execute the following steps in a transaction:
    const result = await this.authVerificationUnitOfWork.run(async (transaction) => {
      user.markVerified();
      // step 8: Update the user record to set isVerified to true.
      await transaction.userRepository.save(user);

      // step 9: Load the user profile to get the first name for the welcome email.
      const profile = await transaction.profileRepository.findByUserId(user.id);
      const firstName = profile?.firstName ?? null;

      // Step 10: Create the default workspace.
      const workspaceName = firstName
        ? `${firstName}'s Workspace`
        : 'My Workspace';
      const workspaceSlug = await this.createUniqueWorkspaceSlug(
        transaction.workspaceRepository,
        workspaceName,
      );
      const workspace = Workspace.create({
        name: workspaceName,
        slug: workspaceSlug,
        createdById: user.id,
      });

      await transaction.workspaceRepository.save(workspace);

      // Step 11: Create OWNER membership for the verified user.
      const ownerMembership = UserWorkspace.create({
        userId: user.id,
        workspaceId: workspace.id,
        membership: WorkspaceMembership.OWNER,
      });
      await transaction.workspaceRepository.addMember(ownerMembership);

      // Step 12: Assign WORKSPACE_OWNER role for that workspace.
      let ownerRole = await transaction.roleRepository.findByCode(
        'WORKSPACE_OWNER',
        workspace.id,
      );
      if (!ownerRole) {
        ownerRole = Role.create({
          workspaceId: workspace.id,
          code: 'WORKSPACE_OWNER',
          name: 'Workspace Owner',
        });
        await transaction.roleRepository.save(ownerRole);
      }
      await transaction.roleRepository.assignToUser(
        UserRole.create({
          userId: user.id,
          roleId: ownerRole.id,
          workspaceId: workspace.id,
        }),
      );

      // Step 13: Generate access token scoped to the default workspace.
      const accessToken = await this.tokenService.generateAccessToken({
        userId: user.id,
        email: user.email,
        workspaceId: workspace.id,
        roles: [ownerRole.code],
      });

      // Step 14: Generate refresh token, hash it, and save the session.
      const refreshTokenId = randomUUID();
      const refreshToken = await this.tokenService.generateRefreshToken({
        userId: user.id,
        jti: refreshTokenId,
      });
      const session = UserSession.create({
        userId: user.id,
        refreshTokenHash: this.tokenService.hashToken(refreshToken),
        expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
      });
      await transaction.sessionRepository.save(session);

      return {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: this.tokenService.getAccessTokenExpiresInSeconds(),
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
        },
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          membership: WorkspaceMembership.OWNER,
        },
      };
    });

    // Step 16: Delete Redis OTP key only after the transaction succeeds.
    await this.otpStore.deleteVerificationOtp(normalizedEmail);

    // Step 17: Return tokens, verified user, and default workspace payload.
    return result;
  }

  private async createUniqueWorkspaceSlug(
    workspaceRepository: AuthVerificationTransaction['workspaceRepository'],
    name: string,
  ): Promise<string> {
    const baseSlug = this.slugify(name);
    const existingWorkspace = await workspaceRepository.findBySlug(baseSlug);

    return existingWorkspace
      ? `${baseSlug}-${randomUUID().slice(0, 8)}`
      : baseSlug;
  }

  private slugify(value: string): string {
    return (
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'workspace'
    );
  }
}
