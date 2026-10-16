import { sql } from 'drizzle-orm';
import {
	check,
	geometry,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { categories } from './categories';
import { departments } from './departments';

// Rejected is a terminal exit from any earlier state, not a step after resolved
export const reportStatus = pgEnum('report_status', [
	'submitted',
	'acknowledged',
	'in_progress',
	'resolved',
	'rejected'
]);

export const reports = pgTable(
	'reports',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		// The only identifier users see, displayed as RN-1000
		referenceNumber: integer('reference_number')
			.generatedAlwaysAsIdentity({ startWith: 1000 })
			.notNull()
			.unique(),
		title: varchar('title', { length: 120 }).notNull(),
		description: varchar('description', { length: 2000 }).notNull(),
		// x = longitude, y = latitude. drizzle-kit drops the srid when generating SQL,
		// so 0003_reports.sql was edited by hand to geometry(point, 4326)
		location: geometry('location', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
		// Reverse-geocoded at submission; null when geocoding fails
		address: varchar('address', { length: 255 }),
		// Current state only; history lives in report_events
		status: reportStatus('status').default('submitted').notNull(),
		categoryId: integer('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'restrict' }),
		// Null after account deletion: the report survives, anonymised
		departmentId: integer('department_id').references(() => departments.id, {
			onDelete: 'restrict'
		}),
		reporterId: text('reporter_id').references(() => user.id, { onDelete: 'set null' }),
		assignedToId: text('assigned_to_id').references(() => user.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		index('reports_location_idx').using('gist', table.location),
		index('reports_status_idx').on(table.status),
		index('reports_category_id_idx').on(table.categoryId),
		index('reports_department_id_idx').on(table.departmentId),
		index('reports_reporter_id_idx').on(table.reporterId),
		index('reports_assigned_to_id_idx').on(table.assignedToId),
		check('reports_title_not_blank', sql`btrim(${table.title}) <> ''`),
		check('reports_description_not_blank', sql`btrim(${table.description}) <> ''`)
	]
);

export type ReportStatus = (typeof reportStatus.enumValues)[number];
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
