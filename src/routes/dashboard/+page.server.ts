import { and, asc, count, countDistinct, eq, gte } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { categories, reportEvents, reports, type ReportStatus } from '$lib/server/db/schema';
import { requireStaff } from '$lib/server/auth';
import { categoryColor, FALLBACK_CATEGORY_COLOR } from '$lib/categories';
import { formatDate } from '$lib/time';
import type { PageServerLoad } from './$types';

const OPEN_STATUSES: ReportStatus[] = ['submitted', 'acknowledged', 'in_progress'];
const RESOLVED_WINDOW_MS = 30 * 86_400_000;

export const load: PageServerLoad = async ({ locals }) => {
	requireStaff(locals);

	const [statusCounts, [resolved], categoryCounts, openReports, recentReports] = await Promise.all([
		db.select({ status: reports.status, count: count() }).from(reports).groupBy(reports.status),
		db
			.select({ count: countDistinct(reportEvents.reportId) })
			.from(reportEvents)
			.innerJoin(reports, eq(reports.id, reportEvents.reportId))
			.where(
				and(
					eq(reportEvents.toStatus, 'resolved'),
					eq(reports.status, 'resolved'),
					gte(reportEvents.createdAt, new Date(Date.now() - RESOLVED_WINDOW_MS))
				)
			),
		db
			.select({ id: categories.id, name: categories.name, count: count(reports.id) })
			.from(categories)
			.leftJoin(reports, eq(reports.categoryId, categories.id))
			.groupBy(categories.id)
			.orderBy(asc(categories.id)),
		db.query.reports.findMany({
			where: (r, { inArray }) => inArray(r.status, OPEN_STATUSES),
			columns: {
				id: true,
				referenceNumber: true,
				title: true,
				address: true,
				location: true,
				categoryId: true
			}
		}),
		db.query.reports.findMany({
			orderBy: (r, { desc }) => [desc(r.createdAt)],
			limit: 8,
			columns: {
				id: true,
				referenceNumber: true,
				title: true,
				address: true,
				location: true,
				status: true,
				createdAt: true
			},
			with: { category: { columns: { name: true } } }
		})
	]);

	const byStatus = (status: ReportStatus) =>
		statusCounts.find((row) => row.status === status)?.count ?? 0;

	const categoryList = categoryCounts.map((c, index) => ({ ...c, color: categoryColor(index) }));

	return {
		stats: {
			open: OPEN_STATUSES.reduce((total, status) => total + byStatus(status), 0),
			submitted: byStatus('submitted'),
			inProgress: byStatus('in_progress'),
			resolved30d: resolved?.count ?? 0
		},
		categories: categoryList,
		points: openReports.map((r) => ({
			id: r.id,
			reference: `RN-${r.referenceNumber}`,
			title: r.title,
			address: r.address,
			lng: r.location.x,
			lat: r.location.y,
			color: categoryList.find((c) => c.id === r.categoryId)?.color ?? FALLBACK_CATEGORY_COLOR
		})),
		recent: recentReports.map((r) => ({
			id: r.id,
			reference: `RN-${r.referenceNumber}`,
			title: r.title,
			category: r.category.name,
			address: r.address ?? `${r.location.y.toFixed(5)}, ${r.location.x.toFixed(5)}`,
			status: r.status,
			submittedOn: formatDate(r.createdAt)
		}))
	};
};
