import { sql } from 'drizzle-orm';
import { check, pgTable, smallint, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { reports } from './reports';

// Photo metadata only; the files live on disk under UPLOADS_DIR (lib/server/storage.ts).
// Deleting a report removes these rows, but the files need deleteReportPhotos.
export const reportPhotos = pgTable(
	'report_photos',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		reportId: uuid('report_id')
			.notNull()
			.references(() => reports.id, { onDelete: 'cascade' }),
		// Object key relative to the uploads folder (e.g. reports/<id>/<uuid>.jpg), never a
		// full URL or path, so the storage location can change later
		objectKey: text('object_key').notNull().unique(),
		// Display order within the report, starting at 0
		position: smallint('position').default(0).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		// Also serves as the index for looking up a report's photos
		unique('report_photos_report_id_position_unique').on(table.reportId, table.position),
		check('report_photos_object_key_not_blank', sql`btrim(${table.objectKey}) <> ''`),
		check('report_photos_object_key_not_url', sql`${table.objectKey} !~* '^[a-z]+://'`),
		check('report_photos_position_non_negative', sql`${table.position} >= 0`)
	]
);

export type ReportPhoto = typeof reportPhotos.$inferSelect;
export type NewReportPhoto = typeof reportPhotos.$inferInsert;
