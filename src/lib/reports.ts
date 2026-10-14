import type { ReportStatus } from '$lib/server/db/schema';

export const MAX_TITLE = 120;
export const MIN_DESCRIPTION = 20;
export const MAX_DESCRIPTION = 2000;
export const MAX_ADDRESS = 255;

export const statusMeta: Record<ReportStatus, { label: string; badge: string; stage: number }> = {
	submitted: { label: 'Submitted', badge: 'bg-sky-100 text-sky-700', stage: 1 },
	acknowledged: { label: 'Acknowledged', badge: 'bg-primary/10 text-primary', stage: 2 },
	in_progress: { label: 'In Progress', badge: 'bg-amber-100 text-amber-700', stage: 3 },
	resolved: { label: 'Resolved', badge: 'bg-emerald-100 text-emerald-700', stage: 4 },
	rejected: { label: 'Rejected', badge: 'bg-destructive/10 text-destructive', stage: 0 }
};
