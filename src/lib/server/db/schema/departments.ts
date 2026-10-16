import { sql } from 'drizzle-orm';
import { boolean, check, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const departments = pgTable(
	'departments',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
		name: varchar('name', { length: 80 }).notNull().unique(),
		slug: varchar('slug', { length: 80 }).notNull().unique(),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		check('departments_name_not_blank', sql`btrim(${table.name}) <> ''`),
		check('departments_slug_not_blank', sql`btrim(${table.slug}) <> ''`)
	]
);

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
