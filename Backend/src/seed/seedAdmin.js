import { env } from '../config/env.js';
import { User } from '../models/User.js';

/**
 * Ensure at least one admin account exists.
 *
 * - On first boot of a fresh database, this creates the admin specified
 *   by `SEED_ADMIN_*` env vars.
 * - On subsequent boots, if any admin already exists, this is a no-op.
 * - The function never overwrites an existing account: if an account
 *   with the seed email exists but is NOT an admin, we leave it alone
 *   and warn — that's a misconfiguration we want a human to look at.
 */
export async function seedAdminIfNeeded() {
  const existingAdmins = await User.countDocuments({ role: 'admin' });
  if (existingAdmins > 0) return;

  if (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD) {
    // eslint-disable-next-line no-console
    console.warn('[seed] No admin in DB and SEED_ADMIN_* not set — skipping admin seed.');
    return;
  }

  const sameEmail = await User.findOne({ email: env.SEED_ADMIN_EMAIL });
  if (sameEmail) {
    // eslint-disable-next-line no-console
    console.warn(`[seed] User with seed email already exists but isn't admin (role=${sameEmail.role}). Skipping.`);
    return;
  }

  const passwordHash = await User.hashPassword(env.SEED_ADMIN_PASSWORD);
  await User.create({
    name: env.SEED_ADMIN_NAME,
    email: env.SEED_ADMIN_EMAIL,
    passwordHash,
    role: 'admin',
    verified: true,
  });
  // eslint-disable-next-line no-console
  console.log(`[seed] Created seed admin: ${env.SEED_ADMIN_EMAIL}`);
}
