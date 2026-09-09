import 'server-only';

import { db } from '@/lib/db/client';
import { adminAuditLogs } from '@/lib/db/schema';

export async function recordAdminAuditLog({
  adminUserId,
  action,
  targetType,
  targetId,
  metadata,
}: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
}) {
  await db.insert(adminAuditLogs).values({
    adminUserId,
    action,
    targetType,
    targetId,
    metadata,
  });
}
