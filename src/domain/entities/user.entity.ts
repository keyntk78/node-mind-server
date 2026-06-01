import { randomUUID } from 'node:crypto';
import { AggregateRoot } from '@domain/entities/base/aggregate-root.base';

export type UserProps = {
  id: string;
  email: string;
  passwordHash: string | null;
  isActive: boolean;
  isVerified: boolean;
  mfaEnabled: boolean;
  mfaSecretEncrypted: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserProps = {
  email: string;
  passwordHash?: string | null;
};

export class User extends AggregateRoot<string> {
  private constructor(private props: UserProps) {
    super(props.id);
  }

  /**
   * Creates a new user for the registration flow.
   * New users start active but unverified until email OTP succeeds.
   */
  static create(props: CreateUserProps): User {
    const now = new Date();

    return new User({
      id: randomUUID(),
      email: User.normalizeEmail(props.email),
      passwordHash: props.passwordHash ?? null,
      isActive: true,
      isVerified: false,
      mfaEnabled: false,
      mfaSecretEncrypted: null,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Rehydrates a user from persistence.
   * Use this in repositories when data has already passed database constraints.
   */
  static restore(props: UserProps): User {
    return new User({
      ...props,
      email: User.normalizeEmail(props.email),
    });
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string | null {
    return this.props.passwordHash;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get mfaEnabled(): boolean {
    return this.props.mfaEnabled;
  }

  get mfaSecretEncrypted(): string | null {
    return this.props.mfaSecretEncrypted;
  }

  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  changeEmail(email: string): void {
    this.props.email = User.normalizeEmail(email);
    this.touch();
  }

  /**
   * Stores an already-hashed password.
   * Hashing belongs in application/infrastructure services, not in the entity.
   */
  changePasswordHash(passwordHash: string | null): void {
    this.props.passwordHash = passwordHash;
    this.touch();
  }

  /**
   * Marks email verification as complete after OTP validation.
   */
  markVerified(): void {
    this.props.isVerified = true;
    this.touch();
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  /**
   * Enables MFA using an encrypted TOTP secret.
   * The raw secret must never be stored in the domain entity.
   */
  enableMfa(encryptedSecret: string): void {
    this.props.mfaEnabled = true;
    this.props.mfaSecretEncrypted = encryptedSecret;
    this.touch();
  }

  disableMfa(): void {
    this.props.mfaEnabled = false;
    this.props.mfaSecretEncrypted = null;
    this.touch();
  }

  recordLogin(loginAt = new Date()): void {
    this.props.lastLoginAt = loginAt;
    this.touch(loginAt);
  }

  /**
   * Returns a plain object for repository mappers or serializers.
   */
  toPrimitives(): UserProps {
    return { ...this.props };
  }

  private touch(date = new Date()): void {
    this.props.updatedAt = date;
  }

  private static normalizeEmail(email: string): string {
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Invalid email address.');
    }

    return normalizedEmail;
  }
}
