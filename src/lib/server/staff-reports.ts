import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
	categories,
	departments,
	reportEvents,
	reports,
	reportStatus,
	type ReportStatus
} from '$lib/server/db/schema';
import { categoryColor } from '$lib/categories';

export const MAX_NOTE = 2000;

export async function categoryOptions() {
	const rows = await db
		.select({ id: categories.id, name: categories.name, isActive: categories.isActive })
		.from(categories)
		.orderBy(asc(categories.id));
	return rows.map((c, index) => ({ ...c, color: categoryColor(index) }));
}

export function departmentOptions() {
	return db
		.select({ id: departments.id, name: departments.name, isActive: departments.isActive })
		.from(departments)
		.orderBy(asc(departments.name));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseReportId(value: FormDataEntryValue | null) {
	return typeof value === 'string' && UUID.test(value) ? value : null;
}

export function parseStatus(value: FormDataEntryValue | null): ReportStatus | null {
	return (reportStatus.enumValues as readonly string[]).includes(String(value))
		? (value as ReportStatus)
		: null;
}

export async function changeStatus(
	reportId: string,
	actorId: string,
	toStatus: ReportStatus,
	reason?: string
): Promise<'changed' | 'unchanged' | 'missing'> {
	return db.transaction(async (tx) => {
		const [report] = await tx
			.select({ status: reports.status })
			.from(reports)
			.where(eq(reports.id, reportId))
			.for('update');
		if (!report) return 'missing';
		if (report.status === toStatus) return 'unchanged';

		await tx.update(reports).set({ status: toStatus }).where(eq(reports.id, reportId));
		await tx.insert(reportEvents).values({
			reportId,
			actorId,
			type: 'status_change',
			fromStatus: report.status,
			toStatus,
			body: reason || null,
			isPublic: true
		});
		return 'changed';
	});
}
