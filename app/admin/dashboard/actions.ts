'use server';

import { auth } from '@/lib/auth/server';
import { hasAdminAccess } from '@/lib/auth/roles';
import { db } from '@/lib/db/client';
import {
  adminAuditLogs,
  coinBoosts,
  coinPromotions,
  coins,
  coinSubmissions,
  users,
} from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

const userRoles = ['user', 'admin'] as const;
const coinStatuses = ['active', 'hidden', 'suspended', 'rejected'] as const;
const submissionStatuses = [
  'pending',
  'in-review',
  'needs-changes',
  'approved',
  'rejected',
] as const;
const boostMultipliers = [10, 30, 50, 100, 500] as const;
const promotionDurations = [1, 3, 7, 14, 30] as const;
const boostPackageRules = {
  10: { durationHours: 24, voteMultiplier: 2 },
  30: { durationHours: 72, voteMultiplier: 2 },
  50: { durationHours: 24, voteMultiplier: 3 },
  100: { durationHours: 72, voteMultiplier: 3 },
  500: { durationHours: 168, voteMultiplier: 5 },
} as const;

export async function updateAdminUser(formData: FormData) {
  const adminUser = await requireAdmin();
  const userId = readRequired(formData, 'userId');
  const role = readEnum(formData, 'role', userRoles);
  const banned = formData.get('banned') === 'on';
  const banReason = readOptional(formData, 'banReason');

  if (userId === adminUser.id && (role !== 'admin' || banned)) {
    throw new Error('You cannot remove your own admin access or ban yourself.');
  }

  await db
    .update(users)
    .set({
      role,
      banned,
      banReason: banned ? banReason || 'Admin action' : null,
      banExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await audit(adminUser.id, 'user.updated', 'user', userId, { role, banned });
  revalidatePath('/admin/dashboard');
}

export async function updateAdminCoin(formData: FormData) {
  const adminUser = await requireAdmin();
  const coinId = readNumber(formData, 'coinId');
  const listingStatus = readEnum(formData, 'listingStatus', coinStatuses);
  const category = readOptional(formData, 'category');

  await db
    .update(coins)
    .set({
      listingStatus,
      ...(category ? { category } : {}),
      updatedAt: new Date(),
    })
    .where(eq(coins.id, coinId));

  await audit(adminUser.id, 'coin.updated', 'coin', String(coinId), { listingStatus, category });
  revalidatePath('/admin/dashboard');
}

export async function updateAdminSubmission(formData: FormData) {
  const adminUser = await requireAdmin();
  const submissionId = readRequired(formData, 'submissionId');
  const status = readEnum(formData, 'status', submissionStatuses);

  await db
    .update(coinSubmissions)
    .set({
      status,
      reviewedAt: ['approved', 'rejected'].includes(status) ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(coinSubmissions.id, submissionId));

  await audit(adminUser.id, 'submission.updated', 'submission', submissionId, { status });
  revalidatePath('/admin/dashboard');
}

export async function grantCoinBoost(formData: FormData) {
  const adminUser = await requireAdmin();
  const coinId = readNumber(formData, 'coinId');
  const multiplier = readNumber(formData, 'multiplier');
  const notes = readOptional(formData, 'notes');

  if (!boostMultipliers.includes(multiplier as (typeof boostMultipliers)[number])) {
    throw new Error('Invalid boost package.');
  }

  const rule = boostPackageRules[multiplier as keyof typeof boostPackageRules];

  await cancelActiveBoosts(coinId);
  await db.insert(coinBoosts).values({
    coinId,
    multiplier,
    status: 'active',
    startsAt: new Date(),
    expiresAt: addHours(new Date(), rule.durationHours),
    assignedByUserId: adminUser.id,
    notes,
  });

  await audit(adminUser.id, 'boost.granted', 'coin', String(coinId), {
    package: multiplier,
    voteMultiplier: rule.voteMultiplier,
    durationHours: rule.durationHours,
  });
  revalidatePath('/admin/dashboard');
}

export async function removeCoinBoost(formData: FormData) {
  const adminUser = await requireAdmin();
  const coinId = readNumber(formData, 'coinId');
  await cancelActiveBoosts(coinId);
  await audit(adminUser.id, 'boost.removed', 'coin', String(coinId), {});
  revalidatePath('/admin/dashboard');
}

export async function addPromotedCoin(formData: FormData) {
  const adminUser = await requireAdmin();
  const coinId = readNumber(formData, 'coinId');
  const durationDays = readNumber(formData, 'durationDays');
  const priority = readNumber(formData, 'priority');
  const notes = readOptional(formData, 'notes');

  if (!promotionDurations.includes(durationDays as (typeof promotionDurations)[number])) {
    throw new Error('Invalid promoted duration.');
  }
  if (priority < 1 || priority > 999) {
    throw new Error('Priority must be between 1 and 999.');
  }

  await cancelActivePromotions(coinId);
  await db.insert(coinPromotions).values({
    coinId,
    placement: 'promoted-table',
    priority,
    status: 'active',
    startsAt: new Date(),
    expiresAt: addHours(new Date(), durationDays * 24),
    assignedByUserId: adminUser.id,
    notes,
  });

  await audit(adminUser.id, 'promotion.added', 'coin', String(coinId), {
    durationDays,
    priority,
  });
  revalidatePath('/admin/dashboard');
}

export async function removePromotedCoin(formData: FormData) {
  const adminUser = await requireAdmin();
  const coinId = readNumber(formData, 'coinId');
  await cancelActivePromotions(coinId);
  await audit(adminUser.id, 'promotion.removed', 'coin', String(coinId), {});
  revalidatePath('/admin/dashboard');
}

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/');
  if (!hasAdminAccess(session.user.role)) notFound();
  return session.user;
}

async function cancelActiveBoosts(coinId: number) {
  await db
    .update(coinBoosts)
    .set({ status: 'canceled', updatedAt: new Date() })
    .where(and(eq(coinBoosts.coinId, coinId), eq(coinBoosts.status, 'active')));
}

async function cancelActivePromotions(coinId: number) {
  await db
    .update(coinPromotions)
    .set({ status: 'canceled', updatedAt: new Date() })
    .where(and(eq(coinPromotions.coinId, coinId), eq(coinPromotions.status, 'active')));
}

async function audit(
  adminUserId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown>,
) {
  await db.insert(adminAuditLogs).values({
    adminUserId,
    action,
    targetType,
    targetId,
    metadata,
  });
}

function readRequired(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${key} is required.`);
  return value.trim();
}

function readOptional(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(formData: FormData, key: string) {
  const value = Number(readRequired(formData, key));
  if (!Number.isFinite(value)) throw new Error(`${key} is invalid.`);
  return value;
}

function readEnum<T extends readonly string[]>(formData: FormData, key: string, options: T) {
  const value = readRequired(formData, key);
  if (!options.includes(value)) throw new Error(`${key} is invalid.`);
  return value as T[number];
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
