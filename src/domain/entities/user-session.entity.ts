import { randomUUID } from 'node:crypto';
import { EntityBase } from '@domain/entities/base/entity.base';

export type UserSessionProps = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  createdAt: Date;
};

export type CreateUserSessionProps = {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  deviceInfo?: string | null;
  ipAddress?: string | null;
};

export class UserSession extends EntityBase<string> {
  private constructor(private props: UserSessionProps) {
    super(props.id);
  }

  static create(props: CreateUserSessionProps): UserSession {
    return new UserSession({
      id: randomUUID(),
      userId: props.userId,
      refreshTokenHash: props.refreshTokenHash,
      deviceInfo: UserSession.cleanOptionalText(props.deviceInfo),
      ipAddress: UserSession.cleanOptionalText(props.ipAddress),
      expiresAt: props.expiresAt,
      createdAt: new Date(),
    });
  }

  static restore(props: UserSessionProps): UserSession {
    return new UserSession(props);
  }

  toPrimitives(): UserSessionProps {
    return { ...this.props };
  }

  private static cleanOptionalText(value?: string | null): string | null {
    const cleanedValue = value?.trim();
    return cleanedValue ? cleanedValue : null;
  }
}
