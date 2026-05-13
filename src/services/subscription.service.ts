import { UserService, UserMetadata } from './user.service';

export type AccessDeniedReason =
  | 'user_inactive'
  | 'subscription_expired'
  | 'owner_inactive'
  | 'owner_subscription_expired';

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: AccessDeniedReason };

export const SubscriptionService = {
  /**
   * Checks whether a user is allowed to access the app.
   * For staff, also validates the owner's account and subscription.
   */
  async checkAccess(meta: UserMetadata): Promise<AccessResult> {
    if (!meta.active) {
      return { allowed: false, reason: 'user_inactive' };
    }

    if (meta.role === 'owner' && meta.subscriptionEndsAt && meta.subscriptionEndsAt < Date.now()) {
      return { allowed: false, reason: 'subscription_expired' };
    }

    if (meta.role === 'staff' && meta.ownerId) {
      const owner = await UserService.getUserById(meta.ownerId);
      if (!owner || !owner.active) {
        return { allowed: false, reason: 'owner_inactive' };
      }
      if (owner.subscriptionEndsAt && owner.subscriptionEndsAt < Date.now()) {
        return { allowed: false, reason: 'owner_subscription_expired' };
      }
    }

    return { allowed: true };
  },
};
