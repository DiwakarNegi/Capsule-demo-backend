/** OTP TTL and Redis namespaces — shared by user and admin flows. */
export const OTP_TTL_SECONDS = 300;
export const OTP_LOCK_TTL_SECONDS = 300;

export const OTP_REDIS = {
  userOtp: (mobile: string) => `otp:user:${mobile}`,
  userLock: (mobile: string) => `otp:lock:user:${mobile}`,
  adminOtp: (email: string) => `otp:admin:${email}`,
  adminLock: (email: string) => `otp:lock:admin:${email}`,
} as const;
