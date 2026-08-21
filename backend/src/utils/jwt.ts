import jwt from "jsonwebtoken";
import { getRequiredEnvironmentVariable } from "./env";

const ACCESS_EXPIRY = process.env.JWT_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";
const JWT_ALGORITHM: jwt.Algorithm = "HS256";

export interface JwtPayload {
  sub: string; // user id
  role: string;
}

export function signAccessToken(payload: JwtPayload) {
  const options: jwt.SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: ACCESS_EXPIRY as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(
    payload,
    getRequiredEnvironmentVariable("JWT_SECRET"),
    options
  );
}

export function signRefreshToken(payload: JwtPayload) {
  const options: jwt.SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: REFRESH_EXPIRY as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(
    payload,
    getRequiredEnvironmentVariable("JWT_REFRESH_SECRET"),
    options
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(
    token,
    getRequiredEnvironmentVariable("JWT_SECRET"),
    { algorithms: [JWT_ALGORITHM] }
  ) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(
    token,
    getRequiredEnvironmentVariable("JWT_REFRESH_SECRET"),
    { algorithms: [JWT_ALGORITHM] }
  ) as JwtPayload;
}

// Refresh token expiry dalam bentuk Date, dipakai buat kolom expires_at
export function refreshTokenExpiryDate(): Date {
  const days = parseInt(REFRESH_EXPIRY.replace("d", ""), 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
