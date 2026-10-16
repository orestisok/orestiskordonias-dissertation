// Seeds the LOCAL database: categories, departments, a staff and a citizen account, and sample
// reports around Thessaloniki. Safe to rerun. Usage: npm run db:seed
import { hashPassword } from 'better-auth/crypto';
import { count, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/server/db/schema';
import type { NewReportEvent, ReportStatus, UserRole } from '../src/lib/server/db/schema';

const { DATABASE_URL, SEED_STAFF_PASSWORD, SEED_CITIZEN_PASSWORD } = process.env;

function fail(message: string): never {
	console.error(`seed: ${message}`);
	process.exit(1);
}

if (!DATABASE_URL) fail('DATABASE_URL is not set');
const host = new URL(DATABASE_URL).hostname;
if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(host)) {
	fail(`refusing to seed non-local database host "${host}"`);
}
if (!SEED_STAFF_PASSWORD || !SEED_CITIZEN_PASSWORD) {
	fail('set SEED_STAFF_PASSWORD and SEED_CITIZEN_PASSWORD in .env');
}

// Names match the submit form (src/routes/submit-report/+page.svelte)
const CATEGORIES = [
	{ slug: 'pothole', name: 'Pothole / Road Damage' },
	{ slug: 'streetlight', name: 'Streetlight Outage' },
	{ slug: 'graffiti', name: 'Graffiti / Vandalism' },
	{ slug: 'illegal-dumping', name: 'Illegal Dumping' },
	{ slug: 'damaged-signage', name: 'Damaged Signage' },
	{ slug: 'water-drainage', name: 'Water / Drainage' },
	{ slug: 'other', name: 'Other' }
];

const DEPARTMENTS = [
	{ slug: 'public-works', name: 'Public Works' },
	{ slug: 'sanitation', name: 'Sanitation' },
	{ slug: 'water-utilities', name: 'Water & Utilities' },
	{ slug: 'transportation', name: 'Transportation' },
	{ slug: 'parks-recreation', name: 'Parks & Recreation' }
];

const USERS: { email: string; name: string; role: UserRole; password: string }[] = [
	{
		email: 'staff@example.com',
		name: 'Municipal Staff',
		role: 'staff',
		password: SEED_STAFF_PASSWORD
	},
	{
		email: 'citizen@example.com',
		name: 'Demo Citizen',
		role: 'citizen',
		password: SEED_CITIZEN_PASSWORD
	}
];

interface SampleReport {
	title: string;
	description: string;
	category: string;
	lng: number;
	lat: number;
	address: string;
	status: ReportStatus;
	daysAgo: number;
	assigned?: boolean;
	comments?: { body: string; isPublic: boolean }[];
	rejectionReason?: string;
}

const REPORTS: SampleReport[] = [
	{
		title: 'Deep pothole outside the school gate',
		description: 'A pothole about 40 cm wide right where parents stop to drop off children.',
		category: 'pothole',
		lng: 22.9444,
		lat: 40.6401,
		address: 'Egnatia 120, Thessaloniki',
		status: 'submitted',
		daysAgo: 1
	},
	{
		title: 'Streetlight flickering at night',
		description: 'The light on the corner flickers on and off all night, the pavement is dark.',
		category: 'streetlight',
		lng: 22.9502,
		lat: 40.6372,
		address: 'Tsimiski 85, Thessaloniki',
		status: 'submitted',
		daysAgo: 2
	},
	{
		title: 'Graffiti on the underpass wall',
		description: 'Large tags covering the whole wall of the pedestrian underpass.',
		category: 'graffiti',
		lng: 22.9391,
		lat: 40.6428,
		address: 'Venizelou 30, Thessaloniki',
		status: 'acknowledged',
		daysAgo: 6
	},
	{
		title: 'Mattresses dumped next to the bins',
		description: 'Two old mattresses and a sofa left beside the recycling bins for a week.',
		category: 'illegal-dumping',
		lng: 22.9478,
		lat: 40.6335,
		address: 'Mitropoleos 60, Thessaloniki',
		status: 'acknowledged',
		daysAgo: 5,
		assigned: true
	},
	{
		title: 'Blocked storm drain',
		description: 'The drain is full of leaves; the street floods every time it rains.',
		category: 'water-drainage',
		lng: 22.9558,
		lat: 40.6455,
		address: 'Kassandrou 150, Thessaloniki',
		status: 'in_progress',
		daysAgo: 12,
		assigned: true,
		comments: [
			{ body: 'Cleaning crew scheduled for this week.', isPublic: true },
			{ body: 'Check whether the pipe below is damaged too.', isPublic: false }
		]
	},
	{
		title: 'Stop sign bent over',
		description: 'The stop sign at the junction was hit and is now facing the pavement.',
		category: 'damaged-signage',
		lng: 22.9415,
		lat: 40.6362,
		address: 'Ermou 45, Thessaloniki',
		status: 'in_progress',
		daysAgo: 9,
		assigned: true
	},
	{
		title: 'Cracked asphalt along the cycle lane',
		description: 'Long cracks along the cycle lane, dangerous for bikes and scooters.',
		category: 'pothole',
		lng: 22.9536,
		lat: 40.6264,
		address: 'Nikis Avenue 15, Thessaloniki',
		status: 'in_progress',
		daysAgo: 15,
		assigned: true,
		comments: [{ body: 'Repairs will be done section by section.', isPublic: true }]
	},
	{
		title: 'Streetlight out near the bus stop',
		description: 'The streetlight next to the bus stop has been off for two weeks.',
		category: 'streetlight',
		lng: 22.9467,
		lat: 40.6398,
		address: 'Agias Sofias 20, Thessaloniki',
		status: 'resolved',
		daysAgo: 20,
		assigned: true,
		comments: [{ body: 'Lamp replaced, working again.', isPublic: true }]
	},
	{
		title: 'Water leaking from the pavement',
		description: 'Clean water is bubbling up between the pavement tiles.',
		category: 'water-drainage',
		lng: 22.9362,
		lat: 40.6389,
		address: 'Olympou 70, Thessaloniki',
		status: 'resolved',
		daysAgo: 25,
		assigned: true
	},
	{
		title: 'Noisy neighbours every weekend',
		description: 'Loud music late every Saturday from the building opposite.',
		category: 'other',
		lng: 22.9512,
		lat: 40.6311,
		address: 'Pavlou Mela 25, Thessaloniki',
		status: 'rejected',
		daysAgo: 8,
		rejectionReason: 'Noise complaints are handled by the police, please call 100.'
	}
];

const STEPS: ReportStatus[] = ['submitted', 'acknowledged', 'in_progress', 'resolved'];
const DAY = 24 * 60 * 60 * 1000;

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client, { schema });

try {
	await db.transaction(async (tx) => {
		for (const c of CATEGORIES) {
			await tx
				.insert(schema.categories)
				.values(c)
				.onConflictDoUpdate({ target: schema.categories.slug, set: { name: c.name } });
		}
		console.log(`categories: ${CATEGORIES.length} upserted`);

		for (const d of DEPARTMENTS) {
			await tx
				.insert(schema.departments)
				.values(d)
				.onConflictDoUpdate({ target: schema.departments.slug, set: { name: d.name } });
		}
		console.log(`departments: ${DEPARTMENTS.length} upserted`);

		const userIds: Partial<Record<UserRole, string>> = {};
		for (const u of USERS) {
			const existing = await tx.query.user.findFirst({ where: eq(schema.user.email, u.email) });
			if (existing) {
				userIds[u.role] = existing.id;
				console.log(`user: ${u.email} already exists`);
				continue;
			}
			const id = crypto.randomUUID();
			await tx
				.insert(schema.user)
				.values({ id, name: u.name, email: u.email, emailVerified: true, role: u.role });
			// Better Auth stores email/password logins as a 'credential' account
			await tx.insert(schema.account).values({
				id: crypto.randomUUID(),
				accountId: id,
				providerId: 'credential',
				userId: id,
				password: await hashPassword(u.password)
			});
			userIds[u.role] = id;
			console.log(`user: ${u.email} created (${u.role})`);
		}
		const staffId = userIds.staff!;
		const citizenId = userIds.citizen!;

		const [{ value: existingReports }] = await tx.select({ value: count() }).from(schema.reports);
		if (existingReports > 0) {
			console.log(`reports: skipped, ${existingReports} already exist`);
			return;
		}

		const categoryIds = new Map(
			(await tx.select().from(schema.categories)).map((c) => [c.slug, c.id])
		);

		const refs: number[] = [];
		for (const r of REPORTS) {
			const createdAt = new Date(Date.now() - r.daysAgo * DAY);
			// Space the timeline evenly between submission and now
			const path: ReportStatus[] =
				r.status === 'rejected'
					? ['submitted', 'rejected']
					: STEPS.slice(0, STEPS.indexOf(r.status) + 1);
			const extra = (r.assigned ? 1 : 0) + (r.comments?.length ?? 0);
			const gap = (r.daysAgo * DAY * 0.9) / Math.max(path.length - 1 + extra, 1);
			let t = createdAt.getTime();
			const at = () => new Date((t += gap));

			const events: Omit<NewReportEvent, 'reportId'>[] = [
				{
					actorId: citizenId,
					type: 'status_change',
					toStatus: 'submitted',
					isPublic: true,
					createdAt
				}
			];
			for (let i = 1; i < path.length; i++) {
				const rejected = path[i] === 'rejected';
				events.push({
					actorId: staffId,
					type: 'status_change',
					fromStatus: path[i - 1],
					toStatus: path[i],
					body: rejected ? r.rejectionReason : undefined,
					isPublic: true,
					createdAt: at()
				});
				if (path[i] === 'acknowledged' && r.assigned) {
					events.push({ actorId: staffId, type: 'assignment', isPublic: false, createdAt: at() });
				}
				if (path[i] === r.status) {
					for (const c of r.comments ?? []) {
						events.push({ actorId: staffId, type: 'comment', ...c, createdAt: at() });
					}
				}
			}

			const [report] = await tx
				.insert(schema.reports)
				.values({
					title: r.title,
					description: r.description,
					location: { x: r.lng, y: r.lat },
					address: r.address,
					status: r.status,
					categoryId: categoryIds.get(r.category)!,
					reporterId: citizenId,
					assignedToId: r.assigned ? staffId : null,
					createdAt,
					updatedAt: events.at(-1)!.createdAt
				})
				.returning({ id: schema.reports.id, ref: schema.reports.referenceNumber });
			await tx
				.insert(schema.reportEvents)
				.values(events.map((e) => ({ ...e, reportId: report.id })));
			refs.push(report.ref);
		}
		console.log(`reports: ${refs.length} inserted (RN-${refs[0]} to RN-${refs.at(-1)})`);
	});
} finally {
	await client.end();
}
