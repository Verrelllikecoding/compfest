import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_EXPIRY = process.env.JWT_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

export interface JwtPayload {
  sub: string; // user id
  role: string;
}

export function signAccessToken(payload: JwtPayload) {
  const options: jwt.SignOptions = { expiresIn: ACCESS_EXPIRY as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, ACCESS_SECRET, options);
}

export function signRefreshToken(payload: JwtPayload) {
  const options: jwt.SignOptions = { expiresIn: REFRESH_EXPIRY as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}

// Refresh token expiry dalam bentuk Date, dipakai buat kolom expires_at
export function refreshTokenExpiryDate(): Date {
  const days = parseInt(REFRESH_EXPIRY.replace("d", ""), 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
