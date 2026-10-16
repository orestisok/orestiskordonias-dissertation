import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { reportEvents, reports, type ReportEvent } from '$lib/server/db/schema';
import { requireStaff } from '$lib/server/auth';
import {
	categoryOptions,
	changeStatus,
	departmentOptions,
	MAX_NOTE,
	parseStatus
} from '$lib/server/staff-reports';
import { photoUrl } from '$lib/photos';
import { statusMeta } from '$lib/reports';
import { formatDate } from '$lib/time';
import type { Actions, PageServerLoad } from './$types';

function findReport(reference: string) {
	const referenceNumber = Number(reference);
	if (!Number.isInteger(referenceNumber)) return undefined;

	return db.query.reports.findFirst({
		where: (r, { eq }) => eq(r.referenceNumber, referenceNumber),
		columns: {
			id: true,
			referenceNumber: true,
			title: true,
			description: true,
			address: true,
			location: true,
			status: true,
			categoryId: true,
			departmentId: true,
			createdAt: true
		},
		with: {
			reporter: { columns: { name: true } },
			photos: {
				columns: { objectKey: true },
				orderBy: (p, { asc }) => [asc(p.position)]
			},
			events: {
				columns: {
					id: true,
					type: true,
					fromStatus: true,
					toStatus: true,
					body: true,
					isPublic: true,
					createdAt: true
				},
				with: { actor: { columns: { name: true } } },
				orderBy: (e, { desc }) => [desc(e.createdAt)]
			}
		}
	});
}

function eventLabel(event: Pick<ReportEvent, 'type' | 'toStatus' | 'isPublic'>) {
	switch (event.type) {
		case 'status_change':
			return event.toStatus ? statusMeta[event.toStatus].label : 'Status changed';
		case 'comment':
			return event.isPublic ? 'Public update' : 'Internal note';
		case 'assignment':
			return 'Assignment';
		case 'edit':
			return 'Edited by reporter';
	}
}

function eventBody(event: Pick<ReportEvent, 'type' | 'fromStatus' | 'body'>) {
	if (event.body) return event.body;
	if (event.type === 'status_change' && !event.fromStatus) return 'Report received from citizen.';
	return null;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	requireStaff(locals);

	const report = await findReport(params.reference);
	if (!report) error(404, 'Report not found');

	const [categories, departments] = await Promise.all([categoryOptions(), departmentOptions()]);
	const reference = `RN-${report.referenceNumber}`;

	return {
		pageTitle: `Report ${reference}`,
		categories: categories.filter((c) => c.isActive || c.id === report.categoryId),
		departments: departments.filter((d) => d.isActive || d.id === report.departmentId),
		report: {
			id: report.id,
			reference,
			title: report.title,
			description: report.description,
			address: report.address ?? `${report.location.y.toFixed(5)}, ${report.location.x.toFixed(5)}`,
			reporter: report.reporter?.name ?? 'a deleted account',
			submittedOn: formatDate(report.createdAt),
			status: report.status,
			categoryId: report.categoryId,
			departmentId: report.departmentId,
			photos: report.photos.map((p) => photoUrl(p.objectKey)),
			history: report.events.map((e) => ({
				id: e.id,
				label: eventLabel(e),
				body: eventBody(e),
				color: e.type === 'status_change' && e.toStatus ? statusMeta[e.toStatus].color : null,
				actor: e.actor?.name ?? null,
				date: formatDate(e.createdAt)
			}))
		}
	};
};

async function reportFor(reference: string) {
	const report = await findReport(reference);
	if (!report) error(404, 'Report not found');
	return report;
}

export const actions: Actions = {
	status: async ({ request, locals, params }) => {
		const user = requireStaff(locals);
		const report = await reportFor(params.reference);
		const status = parseStatus((await request.formData()).get('status'));

		if (!status) return fail(400, { section: 'status', message: 'Choose a valid status.' });
		if (status === 'rejected') {
			return fail(400, {
				section: 'status',
				message: 'Write the reason in the public update note to reject this report.'
			});
		}

		const result = await changeStatus(report.id, user.id, status);
		if (result === 'unchanged') {
			return fail(400, { section: 'status', message: 'The report already has that status.' });
		}
		return { section: 'status', success: `Status changed to ${statusMeta[status].label}.` };
	},
	assign: async ({ request, locals, params }) => {
		const user = requireStaff(locals);
		const report = await reportFor(params.reference);
		const data = await request.formData();
		const categoryId = Number(data.get('categoryId'));
		const departmentValue = String(data.get('departmentId') ?? '');
		const departmentId = departmentValue === '' ? null : Number(departmentValue);

		const [categories, departments] = await Promise.all([categoryOptions(), departmentOptions()]);
		const category = categories.find(
			(c) => c.id === categoryId && (c.isActive || c.id === report.categoryId)
		);
		const department =
			departmentId === null
				? null
				: departments.find(
						(d) => d.id === departmentId && (d.isActive || d.id === report.departmentId)
					);

		if (!category) return fail(400, { section: 'assign', message: 'Select a valid category.' });
		if (department === undefined) {
			return fail(400, { section: 'assign', message: 'Select a valid department.' });
		}

		const changes = [
			category.id !== report.categoryId && `Category changed to ${category.name}.`,
			departmentId !== report.departmentId &&
				(department ? `Assigned to ${department.name}.` : 'Removed from its department.')
		].filter((change): change is string => typeof change === 'string');
		if (!changes.length) {
			return fail(400, {
				section: 'assign',
				message: 'Nothing to save, the assignment is the same.'
			});
		}

		await db.transaction(async (tx) => {
			await tx
				.update(reports)
				.set({ categoryId: category.id, departmentId })
				.where(eq(reports.id, report.id));
			await tx.insert(reportEvents).values({
				reportId: report.id,
				actorId: user.id,
				type: 'assignment',
				body: changes.join(' '),
				isPublic: false
			});
		});
		return { section: 'assign', success: 'Assignment saved.' };
	},
	note: async ({ request, locals, params }) => {
		const user = requireStaff(locals);
		const report = await reportFor(params.reference);
		const data = await request.formData();
		const body = String(data.get('body') ?? '').trim();
		const reject = data.get('reject') === 'on';

		if (!body || body.length > MAX_NOTE) {
			return fail(400, {
				section: 'note',
				body,
				message: reject
					? `Write the rejection reason (up to ${MAX_NOTE} characters).`
					: `Write a note of up to ${MAX_NOTE} characters.`
			});
		}

		if (reject) {
			const result = await changeStatus(report.id, user.id, 'rejected', body);
			if (result === 'unchanged') {
				return fail(400, { section: 'note', body, message: 'This report is already rejected.' });
			}
			return { section: 'note', success: 'Report rejected. The reason is visible to the citizen.' };
		}

		await db.transaction(async (tx) => {
			await tx.insert(reportEvents).values({
				reportId: report.id,
				actorId: user.id,
				type: 'comment',
				body,
				isPublic: true
			});
			await tx.update(reports).set({ updatedAt: new Date() }).where(eq(reports.id, report.id));
		});
		return { section: 'note', success: 'Update posted.' };
	}
};
