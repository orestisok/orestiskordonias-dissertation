import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '$env/dynamic/private';

type Email = { to: string; subject: string; text: string; html: string };

let transporter: Transporter | undefined;

function smtp() {
	const { SMTP_URL, EMAIL_FROM } = env;
	if (!SMTP_URL || !EMAIL_FROM) {
		throw new Error('Email is not configured: set SMTP_URL and EMAIL_FROM in .env');
	}

	transporter ??= nodemailer.createTransport(SMTP_URL);
	return { transporter, from: EMAIL_FROM };
}

export async function sendEmail({ to, subject, text, html }: Email) {
	const { transporter, from } = smtp();
	await transporter.sendMail({ from, to, subject, text, html });
}

const escapeHtml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');

export function verificationEmail(to: string, name: string, url: string): Email {
	return {
		to,
		subject: 'Verify your CivicScan email',
		text: `Hi ${name},\n\nConfirm your email address to finish creating your CivicScan account:\n${url}\n\nIf you didn't create an account, you can ignore this email.`,
		html: `<p>Hi ${escapeHtml(name)},</p>
<p>Confirm your email address to finish creating your CivicScan account:</p>
<p><a href="${escapeHtml(url)}">Verify email address</a></p>
<p>If you didn't create an account, you can ignore this email.</p>`
	};
}
