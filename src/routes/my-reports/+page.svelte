<script lang="ts">
	import TopBar from '$lib/dashboard/top-bar.svelte';
	import Footer from '$lib/dashboard/footer.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { PlusSignIcon, PencilEdit02Icon } from '@hugeicons/core-free-icons';

	type ReportStatus = 'submitted' | 'acknowledged' | 'in-progress' | 'resolved';

	interface Report {
		id: string;
		status: ReportStatus;
		updatedAt: string;
		title: string;
		category: string;
		location: string;
		refId: string;
		note: string;
		image: string;
	}

	interface StatusMeta {
		label: string;
		badge: string;
		stage: number;
	}

	// mock data (for now)
	const reports: Report[] = [
		{
			id: 'RN-2481',
			status: 'in-progress',
			updatedAt: '1 d ago',
			title: 'Bins overflowing at Loukakou tram stop',
			category: 'Garbage & waste',
			location: 'Loukakou 12',
			refId: 'AB-302898',
			note: 'Extra collection ordered for tomorrow morning and we are adding a third bin for the summer.',
			image: 'https://picsum.photos/seed/rn2481/240/240'
		},
		{
			id: 'RN-2479',
			status: 'acknowledged',
			updatedAt: '2 d ago',
			title: 'Deep pothole outside the school gate',
			category: 'Road damage',
			location: 'Loukianou 4',
			refId: 'AB-247139',
			note: 'Thanks — we have measured it and it is on the patching list for next week.',
			image: 'https://picsum.photos/seed/rn2479/240/240'
		},
		{
			id: 'RN-2465',
			status: 'submitted',
			updatedAt: '8 h ago',
			title: 'Broken swing in Anthopoulou playground',
			category: 'Parks & greenery',
			location: 'Anthopoulou',
			refId: 'AB-138194',
			note: 'Received — a coordinator will look at this within two working days.',
			image: 'https://picsum.photos/seed/rn2465/240/240'
		},
		{
			id: 'RN-2460',
			status: 'in-progress',
			updatedAt: '3 d ago',
			title: 'Graffiti on the underpass wall',
			category: 'Vandalism',
			location: 'Vraxnou 8',
			refId: 'AB-119027',
			note: 'Cleaning crew scheduled for Thursday.',
			image: 'https://picsum.photos/seed/rn2460/240/240'
		},
		{
			id: 'RN-2455',
			status: 'in-progress',
			updatedAt: '4 d ago',
			title: 'Streetlight flickering at night',
			category: 'Streetlights',
			location: 'Vraxnou 22',
			refId: 'AB-118834',
			note: 'Electrician assigned, replacement part on order.',
			image: 'https://picsum.photos/seed/rn2455/240/240'
		},
		{
			id: 'RN-2448',
			status: 'acknowledged',
			updatedAt: '5 d ago',
			title: 'Blocked storm drain on Sirakouswn',
			category: 'Water & drainage',
			location: 'Sirakouswn 5',
			refId: 'AB-117290',
			note: 'Logged and prioritised for inspection.',
			image: 'https://picsum.photos/seed/rn2448/240/240'
		},
		{
			id: 'RN-2441',
			status: 'in-progress',
			updatedAt: '6 d ago',
			title: 'Fallen tree branch on the cycle path',
			category: 'Parks & greenery',
			location: 'Sirakouswn 3',
			refId: 'AB-116540',
			note: 'Arborist dispatched to clear the path.',
			image: 'https://picsum.photos/seed/rn2441/240/240'
		},
		{
			id: 'RN-2437',
			status: 'resolved',
			updatedAt: '1 wk ago',
			title: 'Missing stop sign at the junction',
			category: 'Signage',
			location: 'Sirakouswn 11',
			refId: 'AB-115003',
			note: 'New sign installed and verified on site.',
			image: 'https://picsum.photos/seed/rn2437/240/240'
		},
		{
			id: 'RN-2430',
			status: 'acknowledged',
			updatedAt: '1 wk ago',
			title: 'Overflowing recycling point',
			category: 'Garbage & waste',
			location: 'Sirakouswn 9',
			refId: 'AB-114221',
			note: 'Extra pickup requested from the contractor.',
			image: 'https://picsum.photos/seed/rn2430/240/240'
		},
		{
			id: 'RN-2422',
			status: 'in-progress',
			updatedAt: '2 wk ago',
			title: 'Damaged bench in the central park',
			category: 'Parks & greenery',
			location: 'Anthopoulou',
			refId: 'AB-113118',
			note: 'Repair materials ordered.',
			image: 'https://picsum.photos/seed/rn2422/240/240'
		},
		{
			id: 'RN-2415',
			status: 'acknowledged',
			updatedAt: '2 wk ago',
			title: 'Faded pedestrian crossing',
			category: 'Road damage',
			location: 'Anthopoulou 14',
			refId: 'AB-112077',
			note: 'Scheduled for repainting during the next dry spell.',
			image: 'https://picsum.photos/seed/rn2415/240/240'
		},
		{
			id: 'RN-2408',
			status: 'in-progress',
			updatedAt: '3 wk ago',
			title: 'Noise from a broken ventilation unit',
			category: 'Other',
			location: 'Anthopoulou 30',
			refId: 'AB-110945',
			note: 'Technician booked to assess the unit.',
			image: 'https://picsum.photos/seed/rn2408/240/240'
		}
	];

	const statusMeta: Record<ReportStatus, StatusMeta> = {
		submitted: { label: 'Submitted', badge: 'bg-sky-100 text-sky-700', stage: 1 },
		acknowledged: { label: 'Acknowledged', badge: 'bg-primary/10 text-primary', stage: 2 },
		'in-progress': { label: 'In Progress', badge: 'bg-amber-100 text-amber-700', stage: 3 },
		resolved: { label: 'Resolved', badge: 'bg-emerald-100 text-emerald-700', stage: 4 }
	};

	let activeFilter = $state<'all' | ReportStatus>('all');

	//number inside pill buttons
	const counts = $derived({
		all: reports.length,
		acknowledged: reports.filter((report) => report.status === 'acknowledged').length,
		'in-progress': reports.filter((report) => report.status === 'in-progress').length,
		resolved: reports.filter((report) => report.status === 'resolved').length
	});

	const visibleReports = $derived(
		activeFilter === 'all' ? reports : reports.filter((report) => report.status === activeFilter)
	);
</script>

<svelte:head>
	<title>My Reports - CivicScan</title>
</svelte:head>

<div class="bg-muted/30 flex min-h-screen flex-col">
	<div class="bg-background border-b">
		<TopBar />
	</div>

	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-10">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="max-w-xl">
				<h1 class="font-heading text-primary text-4xl font-extrabold tracking-tight">My Reports</h1>

				<p class="text-muted-foreground mt-2">
					Track the status of your submitted municipal service requests and stay updated <br /> on city
					maintenance efforts.
				</p>
			</div>

			<Button href="/submit-report" class="shrink-0">
				<HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
				Submit New Report
			</Button>
		</div>

		<div class="-mx-4 mt-8 overflow-x-auto px-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
			<ToggleGroup.Root
				type="single"
				value={activeFilter}
				onValueChange={(newValue) => (activeFilter = (newValue || 'all') as typeof activeFilter)}
				class="flex w-max flex-nowrap justify-start gap-2"
			>
				<ToggleGroup.Item value="all">All Reports ({counts.all})</ToggleGroup.Item>
				<ToggleGroup.Item value="acknowledged"
					>Acknowledged ({counts.acknowledged})</ToggleGroup.Item
				>
				<ToggleGroup.Item value="in-progress"
					>In Progress ({counts['in-progress']})</ToggleGroup.Item
				>
				<ToggleGroup.Item value="resolved">Resolved ({counts.resolved})</ToggleGroup.Item>
			</ToggleGroup.Root>
		</div>

		<div class="mt-10 flex flex-col gap-4">
			{#each visibleReports as report (report.id)}
				<article class="bg-background flex flex-col gap-5 border p-4 sm:flex-row md:p-5">
					<img src={report.image} alt="" class="h-40 w-full shrink-0 object-cover sm:size-32" />

					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
							<span class="text-muted-foreground text-sm font-semibold">{report.id}</span>
							<span
								class="px-2 py-0.5 text-xs font-semibold tracking-wide uppercase {statusMeta[
									report.status
								].badge}"
							>
								{statusMeta[report.status].label}
							</span>
							<span class="text-muted-foreground text-xs">{report.updatedAt}</span>
							<Button variant="outline" size="sm" class="ml-auto">
								<HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
								Edit
							</Button>
						</div>

						<h2 class="font-heading mt-2 text-xl font-bold tracking-tight">{report.title}</h2>
						<p class="text-muted-foreground mt-1 text-sm">
							{report.category} · {report.location} · ID:{report.refId}
						</p>

						<div class="mt-3 flex gap-1.5">
							{#each [1, 2, 3, 4] as seg (seg)}
								<span
									class="h-1.5 flex-1 {seg <= statusMeta[report.status].stage
										? 'bg-primary'
										: 'bg-muted'}"
								></span>
							{/each}
						</div>

						<div class="bg-muted/50 border-primary mt-3 border-l-2 px-4 py-3">
							<p class="text-muted-foreground text-sm italic">"{report.note}"</p>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</main>

	<footer class="bg-muted/60 border-t py-8">
		<Footer />
	</footer>
</div>
