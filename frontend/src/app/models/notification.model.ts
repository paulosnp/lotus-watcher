export interface Notification {
    id: string; // UUID
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string; // ISO Date
    type: 'PRICE_ALERT' | 'SYSTEM_INFO';
}
