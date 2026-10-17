import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const notificationReads = pgTable('notification_reads', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	readAt: timestamp('read_at', { withTimezone: true }).notNull()
});

export type NotificationRead = typeof notificationReads.$inferSelect;
