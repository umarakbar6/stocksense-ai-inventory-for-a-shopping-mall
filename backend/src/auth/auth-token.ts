import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);
const issuer = "stocksense-backend";
const audience = "stocksense-browser";

export async function issueAuthToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(env.AUTH_TOKEN_TTL)
    .sign(secret);
}

export async function verifyAuthToken(token: string) {
  const result = await jwtVerify(token, secret, { issuer, audience, algorithms: ["HS256"] });
  if (!result.payload.sub) throw new Error("Token subject is missing.");
  return result.payload.sub;
}

