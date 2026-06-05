export interface ActivityLog {
    id: string;
    action: 'user_created' | 'user_deleted' | 'user_status_changed' | 'subscription_extended' | 'data_wipe';
    targetUserId?: string;
    targetUserName?: string;
    adminId: string;
    adminName: string;
    details: string;
    metadata?: any;
    createdAt: number;
}
