import { sql } from 'drizzle-orm';
import {
	boolean,
	check,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { reports, reportStatus } from './reports';

export const reportEventType = pgEnum('report_event_type', [
	'status_change',
	'comment',
	'assignment'
]);

// The report timeline. The quoted staff note on a report card is the latest public event.
export const reportEvents = pgTable(
	'report_events',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		reportId: uuid('report_id')
			.notNull()
			.references(() => reports.id, { onDelete: 'cascade' }),
		// Null after the account is deleted; the history stays
		actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
		type: reportEventType('type').notNull(),
		fromStatus: reportStatus('from_status'),
		toStatus: reportStatus('to_status'),
		body: varchar('body', { length: 2000 }),
		// Controls whether citizens see this event
		isPublic: boolean('is_public').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		index('report_events_report_id_created_at_idx').on(table.reportId, table.createdAt),
		index('report_events_actor_id_idx').on(table.actorId),
		check(
			'report_events_rejection_has_reason',
			sql`${table.toStatus} IS DISTINCT FROM 'rejected' OR (${table.isPublic} AND btrim(coalesce(${table.body}, '')) <> '')`
		),
		check(
			'report_events_status_change_has_to_status',
			sql`${table.type} <> 'status_change' OR ${table.toStatus} IS NOT NULL`
		),
		check(
			'report_events_comment_has_body',
			sql`${table.type} <> 'comment' OR btrim(coalesce(${table.body}, '')) <> ''`
		)
	]
);

export type ReportEventType = (typeof reportEventType.enumValues)[number];
export type ReportEvent = typeof reportEvents.$inferSelect;
export type NewReportEvent = typeof reportEvents.$inferInsert;
