import { asc, count, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { departments, reports, type ReportStatus } from '$lib/server/db/schema';
import { requireStaff } from '$lib/server/auth';
import { categoryOptions } from '$lib/server/staff-reports';
import { FALLBACK_CATEGORY_COLOR } from '$lib/categories';
import { STATUSES, statusMeta } from '$lib/reports';
import { formatDayMonth } from '$lib/time';
import type { PageServerLoad } from './$types';

const OPEN_STATUSES: ReportStatus[] = ['submitted', 'acknowledged', 'in_progress'];
const WEEKS = 6;
const DEPARTMENT_COLOR = 'var(--primary)';

export const load: PageServerLoad = async ({ locals }) => {
	requireStaff(locals);

	const [statusCounts, categories, categoryCounts, departmentCounts, unassigned, [openAge], weeks] =
		await Promise.all([
			db.select({ status: reports.status, count: count() }).from(reports).groupBy(reports.status),
			categoryOptions(),
			db
				.select({ categoryId: reports.categoryId, count: count() })
				.from(reports)
				.groupBy(reports.categoryId),
			db
				.select({ id: departments.id, name: departments.name, count: count(reports.id) })
				.from(departments)
				.leftJoin(reports, eq(reports.departmentId, departments.id))
				.groupBy(departments.id)
				.orderBy(asc(departments.name)),
			db.$count(reports, isNull(reports.departmentId)),
			db
				.select({
					days: sql<
						number | null
					>`avg(extract(epoch from now() - ${reports.createdAt}) / 86400)::float8`
				})
				.from(reports)
				.where(inArray(reports.status, OPEN_STATUSES)),
			db.execute<{ week: string; count: number }>(sql`
				select to_char(w.week, 'YYYY-MM-DD') as week, count(${reports.id})::int as count
				from generate_series(
					date_trunc('week', now()) - make_interval(weeks => ${WEEKS - 1}),
					date_trunc('week', now()),
					interval '1 week'
				) as w(week)
				left join ${reports} on date_trunc('week', ${reports.createdAt}) = w.week
				group by w.week
				order by w.week
			`)
		]);

	const byStatus = (status: ReportStatus) =>
		statusCounts.find((row) => row.status === status)?.count ?? 0;
	const total = statusCounts.reduce((sum, row) => sum + row.count, 0);
	const rejected = byStatus('rejected');
	const reviewable = total - rejected;

	return {
		stats: {
			total,
			resolvedRate: reviewable ? Math.round((byStatus('resolved') / reviewable) * 100) : null,
			avgDaysOpen: openAge.days === null ? null : Math.round(openAge.days),
			rejected
		},
		byCategory: categories
			.map((c) => ({
				key: c.id,
				label: c.name,
				count: categoryCounts.find((row) => row.categoryId === c.id)?.count ?? 0,
				color: c.color,
				isActive: c.isActive
			}))
			.filter((bar) => bar.isActive || bar.count > 0),
		byStatus: STATUSES.map((status) => ({
			key: status,
			label: statusMeta[status].label,
			count: byStatus(status),
			color: statusMeta[status].color
		})),
		byDepartment: [
			...departmentCounts.map((d) => ({
				key: d.id,
				label: d.name,
				count: d.count,
				color: DEPARTMENT_COLOR
			})),
			{ key: 'none', label: 'Unassigned', count: unassigned, color: FALLBACK_CATEGORY_COLOR }
		],
		weeks: weeks.map((w) => ({
			key: w.week,
			label: formatDayMonth(w.week),
			count: w.count
		}))
	};
};
