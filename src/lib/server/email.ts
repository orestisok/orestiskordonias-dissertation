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
