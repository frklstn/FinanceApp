'use server'

import { verifySession } from '@/lib/auth/session';
import { workspaceService } from '@/lib/services/server/workspace';
import { profileService } from '@/lib/services/server/user.service';
import { adminService } from '@/lib/services/server/admin.service';
import { appSettingsService } from '@/lib/services/server/app-settings.service';

export async function getMe() {
  const session = await verifySession();
  if (!session) return null;

  const [profile, accountId, isSuperAdmin] = await Promise.all([
    profileService.getProfile(session.userId),
    workspaceService.getAccountIdForUser(session.userId),
    adminService.isSuperAdmin(session.userId),
  ]);

  return { userId: session.userId, profile, accountId, isSuperAdmin };
}

export async function getAppSettings() {
  return appSettingsService.getSettings();
}
