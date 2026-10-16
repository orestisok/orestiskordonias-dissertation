const units: [Intl.RelativeTimeFormatUnit, number][] = [
	['year', 365 * 86400],
	['month', 30 * 86400],
	['week', 7 * 86400],
	['day', 86400],
	['hour', 3600],
	['minute', 60]
];
const relative = new Intl.RelativeTimeFormat('en', { style: 'narrow' });
const absolute = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export function timeAgo(date: Date) {
	const seconds = (Date.now() - date.getTime()) / 1000;
	const match = units.find(([, size]) => seconds >= size);
	return match ? relative.format(-Math.floor(seconds / match[1]), match[0]) : 'just now';
}

export function formatDate(date: Date) {
	return absolute.format(date);
}

const dayMonth = new Intl.DateTimeFormat('en-US', {
	day: 'numeric',
	month: 'short',
	timeZone: 'UTC'
});

export function formatDayMonth(isoDate: string) {
	const parts = dayMonth.formatToParts(new Date(`${isoDate}T00:00:00Z`));
	const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
	return `${part('day')} ${part('month')}`;
}
