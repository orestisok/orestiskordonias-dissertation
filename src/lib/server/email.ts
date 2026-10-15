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

type LinkEmail = {
	to: string;
	name: string;
	subject: string;
	intro: string;
	action: string;
	url: string;
	outro: string;
};

function linkEmail({ to, name, subject, intro, action, url, outro }: LinkEmail): Email {
	return {
		to,
		subject,
		text: `Hi ${name},\n\n${intro}\n${url}\n\n${outro}`,
		html: `<p>Hi ${escapeHtml(name)},</p>
<p>${escapeHtml(intro)}</p>
<p><a href="${escapeHtml(url)}">${escapeHtml(action)}</a></p>
<p>${escapeHtml(outro)}</p>`
	};
}

export function verificationEmail(to: string, name: string, url: string) {
	return linkEmail({
		to,
		name,
		url,
		subject: 'Verify your CivicScan email',
		intro: 'Confirm your email address to finish creating your CivicScan account:',
		action: 'Verify email address',
		outro: "If you didn't create an account, you can ignore this email."
	});
}

export function changeEmailConfirmationEmail(
	to: string,
	name: string,
	newEmail: string,
	url: string
) {
	return linkEmail({
		to,
		name,
		url,
		subject: 'Approve your CivicScan email change',
		intro: `We received a request to change your CivicScan email to ${newEmail}. Approve it here and we'll send a confirmation link to the new address:`,
		action: 'Approve email change',
		outro:
			"The link expires in one hour. If you didn't ask for this, ignore this email and change your password."
	});
}

export function newEmailVerificationEmail(to: string, name: string, url: string) {
	return linkEmail({
		to,
		name,
		url,
		subject: 'Confirm your new CivicScan email',
		intro: 'Confirm this address to finish changing the email on your CivicScan account:',
		action: 'Confirm new email',
		outro: "The link expires in one hour. If you didn't ask for this, you can ignore this email."
	});
}

export function resetPasswordEmail(to: string, name: string, url: string) {
	return linkEmail({
		to,
		name,
		url,
		subject: 'Reset your CivicScan password',
		intro: 'We received a request to reset your password. Choose a new one here:',
		action: 'Reset password',
		outro:
			"The link expires in one hour and works once. If you didn't ask for this, you can ignore this email and your password stays the same."
	});
}
