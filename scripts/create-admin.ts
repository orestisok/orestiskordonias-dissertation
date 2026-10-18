import { parseArgs } from 'node:util';
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/server/db/schema';

const MIN_PASSWORD_LENGTH = 8;
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1'];

function fail(message: string): never {
	console.error(`admin:create: ${message}`);
	process.exit(1);
}

function promptHidden(question: string) {
	if (!process.stdin.isTTY) fail('run this in an interactive terminal to enter the password');
	process.stdout.write(question);
	process.stdin.setRawMode(true);
	process.stdin.setEncoding('utf8');
	process.stdin.resume();

	return new Promise<string>((resolve) => {
		let value = '';
		const onData = (chunk: string) => {
			for (const char of chunk) {
				if (char === '\u0003') {
					process.stdout.write('\n');
					process.exit(130);
				}
				if (char === '\r' || char === '\n') {
					process.stdin.off('data', onData);
					process.stdin.setRawMode(false);
					process.stdin.pause();
					process.stdout.write('\n');
					resolve(value);
					return;
				}
				value = char === '\u007f' || char === '\b' ? value.slice(0, -1) : value + char;
			}
		};
		process.stdin.on('data', onData);
	});
}

const { values } = parseArgs({
	options: {
		email: { type: 'string' },
		name: { type: 'string' },
		yes: { type: 'boolean', default: false }
	}
});

const email = values.email?.trim().toLowerCase();
const name = values.name?.trim();
if (!email) fail('usage: npm run admin:create -- --email name@thessaloniki.gr --name "Full Name"');
if (!/^[^@\s]+@thessaloniki\.gr$/.test(email)) fail('the email must end in @thessaloniki.gr');

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) fail('DATABASE_URL is not set');
const host = new URL(DATABASE_URL).hostname;
console.log(`Database host: ${host}`);
if (!LOCAL_HOSTS.includes(host) && !values.yes) {
	fail(`"${host}" is not a local database. Rerun with --yes to write to it.`);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client, { schema });

try {
	const existing = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
	if (existing) {
		if (existing.role === 'admin') {
			console.log(`${email} is already an admin.`);
		} else {
			await db.update(schema.user).set({ role: 'admin' }).where(eq(schema.user.id, existing.id));
			console.log(`${email} promoted from ${existing.role} to admin. Their password is unchanged.`);
		}
	} else {
		if (!name) fail('--name is required when creating a new account');

		const password = await promptHidden('Password: ');
		if (password.length < MIN_PASSWORD_LENGTH) {
			fail(`the password needs at least ${MIN_PASSWORD_LENGTH} characters`);
		}
		if ((await promptHidden('Confirm password: ')) !== password) {
			fail("the passwords don't match");
		}

		const id = crypto.randomUUID();
		const hashed = await hashPassword(password);
		await db.transaction(async (tx) => {
			await tx.insert(schema.user).values({ id, name, email, emailVerified: true, role: 'admin' });
			await tx.insert(schema.account).values({
				id: crypto.randomUUID(),
				accountId: id,
				providerId: 'credential',
				userId: id,
				password: hashed
			});
		});
		console.log(`Admin account created for ${name} (${email}).`);
	}
} finally {
	await client.end();
}
