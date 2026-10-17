import { and, count, desc, eq, gt, inArray, sql, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { notificationReads, reportEvents, reports } from '$lib/server/db/schema';
import { statusMeta } from '$lib/reports';
import { timeAgo } from '$lib/time';

const LIMIT = 20;

export type NotificationKind = 'status' | 'rejected' | 'comment';

export interface Notification {
	id: string;
	reference: string;
	title: string;
	kind: NotificationKind;
	statusLabel: string | null;
	color: string | null;
	body: string | null;
	ago: string;
	unread: boolean;
}

export async function getNotifications(userId: string) {
	const [read] = await db
		.select({ readAt: notificationReads.readAt })
		.from(notificationReads)
		.where(eq(notificationReads.userId, userId));
	const readAt = read?.readAt ?? null;

	const visible = and(
		eq(reports.reporterId, userId),
		eq(reportEvents.isPublic, true),
		inArray(reportEvents.type, ['status_change', 'comment']),
		sql`${reportEvents.actorId} IS DISTINCT FROM ${userId}`
	) as SQL;

	const [rows, [unread]] = await Promise.all([
		db
			.select({
				id: reportEvents.id,
				type: reportEvents.type,
				toStatus: reportEvents.toStatus,
				body: reportEvents.body,
				createdAt: reportEvents.createdAt,
				referenceNumber: reports.referenceNumber,
				title: reports.title
			})
			.from(reportEvents)
			.innerJoin(reports, eq(reportEvents.reportId, reports.id))
			.where(visible)
			.orderBy(desc(reportEvents.createdAt))
			.limit(LIMIT),
		db
			.select({ total: count() })
			.from(reportEvents)
			.innerJoin(reports, eq(reportEvents.reportId, reports.id))
			.where(readAt ? and(visible, gt(reportEvents.createdAt, readAt)) : visible)
	]);

	const items: Notification[] = rows.map((r) => {
		const status = r.type === 'status_change' && r.toStatus ? statusMeta[r.toStatus] : null;
		return {
			id: r.id,
			reference: `RN-${r.referenceNumber}`,
			title: r.title,
			kind: !status ? 'comment' : r.toStatus === 'rejected' ? 'rejected' : 'status',
			statusLabel: status?.label ?? null,
			color: status?.color ?? null,
			body: r.body,
			ago: timeAgo(r.createdAt),
			unread: !readAt || r.createdAt > readAt
		};
	});

	return { items, unreadCount: unread.total };
}

export async function markNotificationsRead(userId: string) {
	const readAt = new Date();
	await db
		.insert(notificationReads)
		.values({ userId, readAt })
		.onConflictDoUpdate({ target: notificationReads.userId, set: { readAt } });
}
