import { relations } from 'drizzle-orm';
import { user, userRole } from './auth';
import { categories } from './categories';
import { departments } from './departments';
import { reportEvents } from './report-events';
import { reportPhotos } from './report-photos';
import { reports } from './reports';

// Kept out of auth.ts because `npm run auth:schema` regenerates that file
export type UserRole = (typeof userRole.enumValues)[number];

// Nested reports (e.g. user -> assignedReports, categories -> reports) must use
// `columns: { location: false }`: Postgres returns nested geometry as GeoJSON, which
// Drizzle's geometry parser can't read. Top-level db.query.reports is fine.

// Drizzle merges this with userRelations from auth.ts. relationName is needed
// because user has two foreign keys into reports.
export const userReportRelations = relations(user, ({ many }) => ({
	reportedReports: many(reports, { relationName: 'reporter' }),
	assignedReports: many(reports, { relationName: 'assignee' }),
	reportEvents: many(reportEvents)
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
	reports: many(reports)
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
	reports: many(reports)
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
	category: one(categories, { fields: [reports.categoryId], references: [categories.id] }),
	department: one(departments, {
		fields: [reports.departmentId],
		references: [departments.id]
	}),
	reporter: one(user, {
		fields: [reports.reporterId],
		references: [user.id],
		relationName: 'reporter'
	}),
	assignee: one(user, {
		fields: [reports.assignedToId],
		references: [user.id],
		relationName: 'assignee'
	}),
	events: many(reportEvents),
	photos: many(reportPhotos)
}));

export const reportEventsRelations = relations(reportEvents, ({ one }) => ({
	report: one(reports, { fields: [reportEvents.reportId], references: [reports.id] }),
	actor: one(user, { fields: [reportEvents.actorId], references: [user.id] })
}));

export const reportPhotosRelations = relations(reportPhotos, ({ one }) => ({
	report: one(reports, { fields: [reportPhotos.reportId], references: [reports.id] })
}));
