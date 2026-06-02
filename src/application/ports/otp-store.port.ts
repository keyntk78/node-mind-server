export const OTP_STORE = Symbol('OTP_STORE');

export interface OtpStore {
  setVerificationOtp(email: string, otp: string): Promise<void>;
  getVerificationOtp(email: string): Promise<string | null>;
  deleteVerificationOtp(email: string): Promise<void>;
}
