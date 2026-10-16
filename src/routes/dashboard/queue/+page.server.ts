import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { requireStaff } from '$lib/server/auth';
import {
	categoryOptions,
	changeStatus,
	departmentOptions,
	parseReportId,
	parseStatus
} from '$lib/server/staff-reports';
import { formatDate } from '$lib/time';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireStaff(locals);

	const [categories, departments, rows] = await Promise.all([
		categoryOptions(),
		departmentOptions(),
		db.query.reports.findMany({
			orderBy: (r, { desc }) => [desc(r.createdAt)],
			columns: {
				id: true,
				referenceNumber: true,
				title: true,
				address: true,
				location: true,
				status: true,
				categoryId: true,
				departmentId: true,
				createdAt: true
			}
		})
	]);

	return {
		categories,
		departments,
		reports: rows.map((r) => ({
			id: r.id,
			referenceNumber: r.referenceNumber,
			reference: `RN-${r.referenceNumber}`,
			title: r.title,
			address: r.address ?? `${r.location.y.toFixed(5)}, ${r.location.x.toFixed(5)}`,
			status: r.status,
			categoryId: r.categoryId,
			departmentId: r.departmentId,
			submittedOn: formatDate(r.createdAt)
		}))
	};
};

export const actions: Actions = {
	status: async ({ request, locals }) => {
		const user = requireStaff(locals);
		const data = await request.formData();
		const reportId = parseReportId(data.get('reportId'));
		const status = parseStatus(data.get('status'));

		if (!reportId || !status) return fail(400, { message: 'Choose a valid status.' });
		if (status === 'rejected') {
			return fail(400, { message: 'Open the report to reject it with a public reason.' });
		}

		const result = await changeStatus(reportId, user.id, status);
		if (result === 'missing') return fail(404, { message: 'That report no longer exists.' });
		return { reportId };
	}
};
