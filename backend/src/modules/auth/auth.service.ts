import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { Errors } from "../../lib/errors.js";
import { generateToken, sha256 } from "../../lib/crypto.js";
import type { RegisterInput, LoginInput, ConfirmVerifyInput } from "./auth.schema.js";

const VERIFICATION_TOKEN_TTL_MS = 15 * 60 * 1000;

function signJwt(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

function toPublicUser(u: {
  id: string;
  email: string;
  displayName: string;
  verificationStatus: string;
  tier: number;
  badges: string[];
}) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    verificationStatus: u.verificationStatus,
    tier: u.tier,
    badges: u.badges,
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw Errors.Conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    },
  });

  return { token: signJwt(user.id), user: toPublicUser(user) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw Errors.Unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw Errors.Unauthorized("Invalid email or password");

  return { token: signJwt(user.id), user: toPublicUser(user) };
}

export async function requestVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Errors.NotFound("No account found for this email");
  if (user.verificationStatus === "VERIFIED") {
    throw Errors.Conflict("Email already verified");
  }

  const rawToken = generateToken();
  await prisma.verificationToken.create({
    data: {
      email,
      token: sha256(rawToken),
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  return { message: "Verification token issued", devToken: rawToken, expiresInMinutes: 15 };
}

export async function confirmVerification(input: ConfirmVerifyInput) {
  const tokenHash = sha256(input.token);

  const record = await prisma.verificationToken.findUnique({ where: { token: tokenHash } });
  if (!record || record.email !== input.email) {
    throw Errors.BadRequest("Invalid verification token");
  }
  if (record.usedAt) throw Errors.BadRequest("Token already used");
  if (record.expiresAt < new Date()) throw Errors.BadRequest("Token expired");

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { token: tokenHash },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { email: input.email },
      data: {
        verificationStatus: "VERIFIED",
        tier: 2,
        badges: { push: "verified_student" },
      },
    }),
  ]);

  const user = await prisma.user.findUniqueOrThrow({ where: { email: input.email } });
  return { user: toPublicUser(user) };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Errors.NotFound("User not found");
  return { user: toPublicUser(user) };
}