-- Admin and staff sign-in with a verified phone number.
ALTER TYPE "OtpPurpose" ADD VALUE IF NOT EXISTS 'ADMIN_LOGIN';
