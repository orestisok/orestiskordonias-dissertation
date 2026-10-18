import { fail } from '@sveltejs/kit';
import { hashPassword } from 'better-auth/crypto';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { account, session, user } from '$lib/server/db/schema';
import {
	isStaffEmail,
	MIN_PASSWORD_LENGTH,
	requireAdmin,
	STAFF_EMAIL_DOMAIN
} from '$lib/server/auth';
import { formatDate } from '$lib/time';
import type { Actions, PageServerLoad } from './$types';

const MAX_NAME_LENGTH = 100;

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);

	const staff = await db
		.select({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
		.from(user)
		.where(eq(user.role, 'staff'))
		.orderBy(asc(user.name));

	return {
		staffDomain: STAFF_EMAIL_DOMAIN,
		minPasswordLength: MIN_PASSWORD_LENGTH,
		staff: staff.map((s) => ({ ...s, createdOn: formatDate(s.createdAt) }))
	};
};

const field = (data: FormData, key: string) => String(data.get(key) ?? '');

function passwordError(password: string, confirmPassword: string) {
	if (password.length < MIN_PASSWORD_LENGTH) {
		return `The password needs at least ${MIN_PASSWORD_LENGTH} characters.`;
	}
	if (password !== confirmPassword) return "The passwords don't match.";
	return null;
}

async function findStaff(id: string) {
	if (!id) return undefined;
	return db.query.user.findFirst({
		where: and(eq(user.id, id), eq(user.role, 'staff')),
		columns: { id: true, name: true, email: true }
	});
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireAdmin(locals);
		const data = await request.formData();
		const name = field(data, 'name').trim();
		const email = field(data, 'email').trim().toLowerCase();
		const password = field(data, 'password');
		const values = { name, email };

		if (!name || name.length > MAX_NAME_LENGTH) {
			return fail(400, {
				section: 'create',
				...values,
				message: `Enter a name of up to ${MAX_NAME_LENGTH} characters.`
			});
		}
		if (!isStaffEmail(email)) {
			return fail(400, {
				section: 'create',
				...values,
				message: `Staff emails must end in @${STAFF_EMAIL_DOMAIN}.`
			});
		}
		const invalidPassword = passwordError(password, field(data, 'confirmPassword'));
		if (invalidPassword) {
			return fail(400, { section: 'create', ...values, message: invalidPassword });
		}

		const existing = await db.query.user.findFirst({
			where: eq(user.email, email),
			columns: { id: true }
		});
		if (existing) {
			return fail(400, {
				section: 'create',
				...values,
				message: 'An account with this email already exists.'
			});
		}

		const id = crypto.randomUUID();
		const hashed = await hashPassword(password);
		await db.transaction(async (tx) => {
			await tx.insert(user).values({ id, name, email, emailVerified: true, role: 'staff' });
			await tx.insert(account).values({
				id: crypto.randomUUID(),
				accountId: id,
				providerId: 'credential',
				userId: id,
				password: hashed
			});
		});

		return { section: 'create', success: `Created a staff account for ${name} (${email}).` };
	},
	setPassword: async ({ request, locals }) => {
		requireAdmin(locals);
		const data = await request.formData();
		const target = await findStaff(field(data, 'userId'));
		if (!target) {
			return fail(404, { section: 'list', message: 'That staff account no longer exists.' });
		}

		const invalidPassword = passwordError(field(data, 'password'), field(data, 'confirmPassword'));
		if (invalidPassword) {
			return fail(400, { section: 'password', userId: target.id, message: invalidPassword });
		}

		const hashed = await hashPassword(field(data, 'password'));
		await db.transaction(async (tx) => {
			const updated = await tx
				.update(account)
				.set({ password: hashed })
				.where(and(eq(account.userId, target.id), eq(account.providerId, 'credential')))
				.returning({ id: account.id });
			if (!updated.length) {
				await tx.insert(account).values({
					id: crypto.randomUUID(),
					accountId: target.id,
					providerId: 'credential',
					userId: target.id,
					password: hashed
				});
			}
			await tx.delete(session).where(eq(session.userId, target.id));
		});

		return {
			section: 'list',
			success: `Set a new password for ${target.name}. They've been signed out everywhere.`
		};
	},
	delete: async ({ request, locals }) => {
		requireAdmin(locals);
		const target = await findStaff(field(await request.formData(), 'userId'));
		if (!target) {
			return fail(404, { section: 'list', message: 'That staff account no longer exists.' });
		}

		await db.delete(user).where(and(eq(user.id, target.id), eq(user.role, 'staff')));

		return { section: 'list', success: `Deleted the account of ${target.name} (${target.email}).` };
	}
};
