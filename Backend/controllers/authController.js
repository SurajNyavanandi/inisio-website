import authService from '../services/authService.js';
import { getRefreshCookieOptions } from '../utils/generateToken.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

const attachRefreshCookieAndSanitize = (res, result) => {
  if (!result || typeof result !== 'object') return result;
  const { refreshToken, ...safePayload } = result;
  if (refreshToken) {
    res.cookie('inisio_refresh_token', refreshToken, getRefreshCookieOptions());
  }
  return safePayload;
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, company, phone } = req.body;
    const user = await authService.registerUser({ name, email, password, role, company, phone });
    return sendSuccess(res, user, user.message || 'User registered successfully. Verification code sent.', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password, req });
    const safeResult = attachRefreshCookieAndSanitize(res, result);
    const message = safeResult.isVerified === false
      ? 'Email verification required. Verification code has been sent to your inbox.'
      : 'Logged in successfully';
    return sendSuccess(res, safeResult, message, 200);
  } catch (error) {
    next(error);
  }
};

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.adminLogin({ email, password, req });
    const safeResult = attachRefreshCookieAndSanitize(res, result);
    return sendSuccess(res, safeResult, safeResult.message || 'Admin authentication successful', 200);
  } catch (error) {
    next(error);
  }
};

export const refreshSession = async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.inisio_refresh_token || req.body?.refreshToken || '';
    const result = await authService.refreshSessionTokens({ refreshToken: cookieToken, req });
    const safeResult = attachRefreshCookieAndSanitize(res, result);
    return sendSuccess(res, safeResult, 'Session refreshed successfully', 200);
  } catch (error) {
    res.clearCookie('inisio_refresh_token', { ...getRefreshCookieOptions(), maxAge: undefined });
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.inisio_refresh_token || req.body?.refreshToken || '';
    await authService.logoutUserSession({
      userId: req.user?._id || null,
      refreshToken: cookieToken,
    });
    res.clearCookie('inisio_refresh_token', { ...getRefreshCookieOptions(), maxAge: undefined });
    return sendSuccess(res, { loggedOut: true }, 'Logged out and session revoked cleanly', 200);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return sendError(res, 'Email and 6-digit OTP verification code are required', 400);
    }
    const result = await authService.verifyEmailOtp({ email, otp, req });
    const safeResult = attachRefreshCookieAndSanitize(res, result);
    return sendSuccess(res, safeResult, safeResult.message || 'Email verified successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user._id, req.user);
    return sendSuccess(res, user, 'User profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateUserProfile(req.user._id, req.body);
    return sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'Please provide an email address', 400);
    }
    let origin = req.headers.origin;
    if (!origin && req.headers.referer) {
      try {
        const urlObj = new URL(req.headers.referer);
        origin = `${urlObj.protocol}//${urlObj.host}`;
      } catch {
        origin = req.headers.referer;
      }
    }
    if (!origin) {
      const host = req.get('host');
      const protocol = req.protocol || 'http';
      origin = `${protocol}://${host}`;
    }

    const result = await authService.forgotPassword(email, origin);
    return sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return sendError(res, 'Email and OTP verification code are required', 400);
    }
    let result;
    try {
      result = await authService.verifyEmailOtp({ email, otp, req });
    } catch (emailErr) {
      try {
        result = await authService.verifyResetOtp({ email, otp });
      } catch {
        throw emailErr;
      }
    }
    const safeResult = attachRefreshCookieAndSanitize(res, result);
    return sendSuccess(res, safeResult, safeResult.message);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return sendError(res, 'Email, OTP, and new password are required', 400);
    }
    const result = await authService.resetPassword({ email, otp, newPassword });
    const safeResult = attachRefreshCookieAndSanitize(res, result);
    return sendSuccess(res, safeResult, safeResult.message);
  } catch (error) {
    next(error);
  }
};

export const sendVerificationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'Please provide an email address', 400);
    }
    const result = await authService.sendVerificationOtp(email);
    return sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  adminLogin,
  refreshSession,
  logout,
  verifyEmail,
  getMe,
  updateProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
  sendVerificationOtp,
};
