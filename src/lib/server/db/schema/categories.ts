import { sql } from 'drizzle-orm';
import { boolean, check, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const categories = pgTable(
	'categories',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
		name: varchar('name', { length: 80 }).notNull().unique(),
		// Stable key for Mapbox icons; ids can differ between environments
		slug: varchar('slug', { length: 80 }).notNull().unique(),
		// Retire instead of deleting; reports reference categories with ON DELETE RESTRICT
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		check('categories_name_not_blank', sql`btrim(${table.name}) <> ''`),
		check('categories_slug_not_blank', sql`btrim(${table.slug}) <> ''`)
	]
);
