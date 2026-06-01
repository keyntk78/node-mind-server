import { randomUUID } from 'node:crypto';
import { EntityBase } from '@domain/entities/base/entity.base';
import { OAuthProvider } from '@domain/entities/enums/oauth-provider.enum';

export type SocialAccountProps = {
  id: string;
  userId: string;
  provider: OAuthProvider;
  providerExternalId: string;
  email: string | null;
  createdAt: Date;
};

export type CreateSocialAccountProps = {
  userId: string;
  provider: OAuthProvider;
  providerExternalId: string;
  email?: string | null;
};

export class SocialAccount extends EntityBase<string> {
  private constructor(private props: SocialAccountProps) {
    super(props.id);
  }

  /**
   * Creates a social account link for an OAuth provider.
   * The unique provider identity is provider + providerExternalId.
   */
  static create(props: CreateSocialAccountProps): SocialAccount {
    return new SocialAccount({
      id: randomUUID(),
      userId: props.userId,
      provider: props.provider,
      providerExternalId: props.providerExternalId.trim(),
      email: SocialAccount.normalizeOptionalEmail(props.email),
      createdAt: new Date(),
    });
  }

  /**
   * Rehydrates a social account from persistence.
   */
  static restore(props: SocialAccountProps): SocialAccount {
    return new SocialAccount({
      ...props,
      email: SocialAccount.normalizeOptionalEmail(props.email),
    });
  }

  get userId(): string {
    return this.props.userId;
  }

  get provider(): OAuthProvider {
    return this.props.provider;
  }

  get providerExternalId(): string {
    return this.props.providerExternalId;
  }

  get email(): string | null {
    return this.props.email;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Returns a plain object for repository mappers or serializers.
   */
  toPrimitives(): SocialAccountProps {
    return { ...this.props };
  }

  private static normalizeOptionalEmail(email?: string | null): string | null {
    if (!email) return null;

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error('Invalid social account email address.');
    }

    return normalizedEmail;
  }
}
