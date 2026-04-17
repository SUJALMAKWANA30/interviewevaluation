import rateLimit from "express-rate-limit";

/*
  Basic global rate limiter
  - Protects against brute force
  - Prevents API abuse
*/

const buildLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

const rateLimiter = buildLimiter(
  60 * 1000,
  200,
  "Too many requests. Please try again later."
);

export const candidateForgotPasswordLimiter = buildLimiter(
  15 * 60 * 1000,
  5,
  "Too many password reset attempts. Please try again in 15 minutes."
);

export const candidateResetPasswordLimiter = buildLimiter(
  15 * 60 * 1000,
  10,
  "Too many reset requests. Please try again in 15 minutes."
);

export default rateLimiter;
