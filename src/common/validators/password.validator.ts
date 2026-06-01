import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

/**
 * This module provides a custom validator to check if a password is strong.
 * A strong password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.
 */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_VALIDATION_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';

export function isStrongPassword(value: string): boolean {
  return PASSWORD_REGEX.test(value);
}
/**
 * Custom validator to check if a password is strong.
 * A strong password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.
 * @param validationOptions Optional validation options to customize the error message.
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: {
        message: PASSWORD_VALIDATION_MESSAGE,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && isStrongPassword(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property}: ${PASSWORD_VALIDATION_MESSAGE}`;
        },
      },
    });
  };
}
