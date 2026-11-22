import { SignJWT, jwtVerify } from "jose";

const secret = process.env.SESSION_SECRET;
if (!secret || secret.length < 32) {
  throw new Error("SESSION_SECRET must contain at least 32 characters");
}

const secretKey = new TextEncoder().encode(secret);

export async function createSessionToken(userId) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId.toString())
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch {
    return null;
  }
}