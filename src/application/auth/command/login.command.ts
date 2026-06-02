export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly deviceInfo: string | null,
    public readonly ipAddress: string | null,
  ) {}
}
