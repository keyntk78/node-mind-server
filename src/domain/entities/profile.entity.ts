import { randomUUID } from 'node:crypto';
import { EntityBase } from '@domain/entities/base/entity.base';

export type ProfileProps = {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  bio: string | null;
  updatedAt: Date;
};

export type CreateProfileProps = {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
};

export class Profile extends EntityBase<string> {
  private constructor(private props: ProfileProps) {
    super(props.id);
  }

  /**
   * Creates the 1-1 profile record attached to a user.
   * Empty optional strings are normalized to null for cleaner persistence.
   */
  static create(props: CreateProfileProps): Profile {
    return new Profile({
      id: randomUUID(),
      userId: props.userId,
      firstName: Profile.cleanOptionalText(props.firstName),
      lastName: Profile.cleanOptionalText(props.lastName),
      avatarUrl: Profile.cleanOptionalText(props.avatarUrl),
      phoneNumber: Profile.cleanOptionalText(props.phoneNumber),
      bio: Profile.cleanOptionalText(props.bio),
      updatedAt: new Date(),
    });
  }

  /**
   * Rehydrates a profile from persistence.
   */
  static restore(props: ProfileProps): Profile {
    return new Profile(props);
  }

  get userId(): string {
    return this.props.userId;
  }

  get firstName(): string | null {
    return this.props.firstName;
  }

  get lastName(): string | null {
    return this.props.lastName;
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  get phoneNumber(): string | null {
    return this.props.phoneNumber;
  }

  get bio(): string | null {
    return this.props.bio;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Updates display name fields together so profile name changes stay atomic.
   */
  updateName(firstName?: string | null, lastName?: string | null): void {
    this.props.firstName = Profile.cleanOptionalText(firstName);
    this.props.lastName = Profile.cleanOptionalText(lastName);
    this.touch();
  }

  updateAvatar(avatarUrl: string | null): void {
    this.props.avatarUrl = Profile.cleanOptionalText(avatarUrl);
    this.touch();
  }

  updatePhoneNumber(phoneNumber: string | null): void {
    this.props.phoneNumber = Profile.cleanOptionalText(phoneNumber);
    this.touch();
  }

  updateBio(bio: string | null): void {
    this.props.bio = Profile.cleanOptionalText(bio);
    this.touch();
  }

  /**
   * Returns a plain object for repository mappers or serializers.
   */
  toPrimitives(): ProfileProps {
    return { ...this.props };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private static cleanOptionalText(value?: string | null): string | null {
    const cleanedValue = value?.trim();
    return cleanedValue ? cleanedValue : null;
  }
}
