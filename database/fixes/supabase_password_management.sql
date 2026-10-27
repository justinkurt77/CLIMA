-- ==========================================
-- Password Management System
-- Features:
-- 1. Track first-time login (force password change)
-- 2. OTP for forgot password
-- 3. Password reset history
-- ==========================================

-- Table to track OTP codes for password reset
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_otp_length CHECK (length(otp_code) = 6)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user_id ON password_reset_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires ON password_reset_otps(expires_at);

-- Add column to profiles to track if user needs to change password
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ;

-- Function to check if OTP is valid
CREATE OR REPLACE FUNCTION verify_password_reset_otp(
  p_email TEXT,
  p_otp_code TEXT
)
RETURNS TABLE (
  valid BOOLEAN,
  user_id UUID,
  message TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  otp_record RECORD;
BEGIN
  -- Find the most recent unused OTP for this email
  SELECT * INTO otp_record
  FROM password_reset_otps
  WHERE email = p_email
    AND otp_code = p_otp_code
    AND used = FALSE
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid or expired OTP code'::TEXT;
    RETURN;
  END IF;
  
  -- Mark OTP as used
  UPDATE password_reset_otps
  SET used = TRUE
  WHERE id = otp_record.id;
  
  RETURN QUERY SELECT TRUE, otp_record.user_id, 'OTP verified successfully'::TEXT;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON password_reset_otps TO authenticated;
GRANT SELECT, INSERT, UPDATE ON password_reset_otps TO anon;
GRANT EXECUTE ON FUNCTION verify_password_reset_otp(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_password_reset_otp(TEXT, TEXT) TO anon;

-- RLS policies for password_reset_otps
ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own OTPs"
  ON password_reset_otps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert OTPs (for forgot password)"
  ON password_reset_otps FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can manage all OTPs"
  ON password_reset_otps FOR ALL
  USING (auth.role() = 'service_role');

-- Clean up expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM password_reset_otps
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;

-- Test data (optional - remove in production)
-- SELECT * FROM password_reset_otps;
-- SELECT * FROM profiles WHERE role IN ('admin', 'superadmin');
