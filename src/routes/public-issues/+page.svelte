<script lang="ts">
	import TopBar from '$lib/dashboard/top-bar.svelte';
	import Footer from '$lib/dashboard/footer.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Eye,
		Location01Icon,
		CheckmarkBadge01Icon,
		ThumbsUpIcon
	} from '@hugeicons/core-free-icons';
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { onMount } from 'svelte';
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';

	mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESS_TOKEN;

	type IssueStatus = 'critical' | 'in-progress' | 'open' | 'submitted';
	type IssueType = 'traffic' | 'utilities' | 'critical';

	interface Issue {
		id: string;
		status: IssueStatus;
		updatedAt: string;
		title: string;
		category: string;
		location: string;
		stage: number;
		type: IssueType;
		lng: number;
		lat: number;
		description: string;
		image: string;
		verified: boolean;
	}

	interface StatusMeta {
		label: string;
		badge: string;
	}

	const statusMeta: Record<IssueStatus, StatusMeta> = {
		critical: { label: 'Critical', badge: 'bg-destructive/10 text-destructive' },
		'in-progress': { label: 'In Progress', badge: 'bg-amber-100 text-amber-700' },
		open: { label: 'Open', badge: 'bg-primary/10 text-primary' },
		submitted: { label: 'Submitted', badge: 'bg-sky-100 text-sky-700' }
	};

	const markerColors: Record<IssueType, string> = {
		traffic: '#16a34a',
		utilities: '#f59e0b',
		critical: '#dc2626'
	};

	// mock data (for now)
	const issues: Issue[] = [
		{
			id: 'RN-2481',
			status: 'critical',
			updatedAt: '12m ago',
			title: 'Large Pothole - 5th Ave Crossing',
			category: 'Infrastructure',
			location: '4220 W 5th Ave',
			stage: 2,
			type: 'critical',
			lng: 22.9444,
			lat: 40.6401,
			description:
				'Deep pothole reported in middle lane. Causing significant traffic slow down and potential vehicle damage.',

			image: 'https://picsum.photos/seed/rn2481/640/360',
			verified: true
		},
		{
			id: 'RN-2479',
			status: 'in-progress',
			updatedAt: '2h ago',
			title: 'Street Light Outage',
			category: 'Utilities',
			location: 'Pine St & Lincoln',
			stage: 3,
			type: 'utilities',
			lng: 22.9502,
			lat: 40.6372,
			description:
				'Street light has been out for several nights, leaving the crossing dark. Crew assigned and replacement part on order.',

			image: 'https://picsum.photos/seed/rn2479/640/360',
			verified: true
		},
		{
			id: 'RN-2465',
			status: 'open',
			updatedAt: '5h ago',
			title: 'Graffiti on Public Bench',
			category: 'Infrastructure',
			location: 'Central Square Park',
			stage: 1,
			type: 'traffic',
			lng: 22.9391,
			lat: 40.6428,
			description:
				'Graffiti sprayed across a public bench near the square. Cleaning has been logged for review.',

			image: 'https://picsum.photos/seed/rn2465/640/360',
			verified: false
		},
		{
			id: 'RN-2452',
			status: 'submitted',
			updatedAt: '8h ago',
			title: 'Broken Playground Swing',
			category: 'Parks & Greenery',
			location: 'Lehtopuisto Park',
			stage: 1,
			type: 'traffic',
			lng: 22.9558,
			lat: 40.6455,
			description:
				'A swing in the playground is broken and unsafe for children. A coordinator will inspect within two working days.',

			image: 'https://picsum.photos/seed/rn2452/640/360',
			verified: false
		}
	];

	// View state (split + map + list).
	type ViewMode = 'split' | 'map' | 'list';
	let view = $state<ViewMode>('split');

	const mapVisible = $derived(view !== 'list');
	const feedVisible = $derived(view !== 'map');

	let activeRange = $state<'24h' | '7d' | '30d'>('24h');
	let category = $state('all');
	let status = $state('all');

	const categoryLabel = $derived(
		category === 'all' ? 'All Categories' : category[0].toUpperCase() + category.slice(1)
	);
	const statusLabel = $derived(
		status === 'all' ? 'All Statuses' : status[0].toUpperCase() + status.slice(1)
	);

	const initialState = { lng: 22.9444, lat: 40.6401, zoom: 14 };

	let map: mapboxgl.Map | undefined;
	let mapContainer: HTMLDivElement;

	onMount(() => {
		map = new mapboxgl.Map({
			container: mapContainer,
			center: [initialState.lng, initialState.lat],
			zoom: initialState.zoom
		});
		map.addControl(new mapboxgl.NavigationControl(), 'top-right');

		for (const issue of issues) {
			new mapboxgl.Marker({ color: markerColors[issue.type] })
				.setLngLat([issue.lng, issue.lat])
				.setPopup(new mapboxgl.Popup({ offset: 24 }).setText(issue.title))
				.addTo(map);
		}

		return () => {
			map?.remove();
			map = undefined;
		};
	});

	// Mapbox needs a resize to recalculate the canvas.
	$effect(() => {
		if (mapVisible && map) {
			requestAnimationFrame(() => map?.resize());
		}
	});

	// Issue detail sheet.
	let detailOpen = $state(false);
	let selectedIssue = $state<Issue | null>(null);

	function openIssue(issue: Issue) {
		selectedIssue = issue;
		detailOpen = true;
	}

	// Sheet slides in from the right on desktop and up from the bottom on mobile.
	let innerWidth = $state(0);
	const sheetSide = $derived(innerWidth >= 768 ? 'right' : 'bottom');

	// Static thumbnail from the Mapbox Static Images API
	function staticMapUrl(issue: Issue) {
		const color = markerColors[issue.type].replace('#', '');
		return (
			`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
			`pin-s+${color}(${issue.lng},${issue.lat})/${issue.lng},${issue.lat},14/500x220@2x` +
			`?access_token=${PUBLIC_MAPBOX_ACCESS_TOKEN}`
		);
	}
</script>

<svelte:head>
	<title>Public Issues - CivicScan</title>
</svelte:head>

<svelte:window bind:innerWidth />

<div class="flex min-h-screen flex-col bg-muted/30">
	<div class="border-b bg-background">
		<TopBar />
	</div>

	<!-- Mobile view switcher -->
	<div class="border-b bg-background px-4 py-2 md:hidden">
		<Tabs.Root value={view} onValueChange={(v) => (view = (v as ViewMode) ?? 'split')}>
			<Tabs.List class="grid w-full grid-cols-3">
				<Tabs.Trigger value="split">Split View</Tabs.Trigger>
				<Tabs.Trigger value="map">Map Only</Tabs.Trigger>
				<Tabs.Trigger value="list">List Feed</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	</div>

	<main class="flex-1">
		<div class="flex flex-col md:h-[calc(100vh-4rem)] md:flex-row">
			<!-- MAP COLUMN: stays mounted; visibility is toggled with a `hidden` class. -->
			<div
				class={cn(
					'relative md:block md:h-full md:flex-1',
					mapVisible ? (view === 'map' ? 'block h-[calc(100vh-8rem)]' : 'block h-80') : 'hidden'
				)}
			>
				<div bind:this={mapContainer} class="h-full w-full"></div>

				<!-- Legend -->
				<div
					class="absolute bottom-4 left-4 flex items-center gap-4 border bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur"
				>
					<span class="flex items-center gap-1.5">
						<span class="size-2.5 rounded-full bg-green-600"></span>Traffic
					</span>
					<span class="flex items-center gap-1.5">
						<span class="size-2.5 rounded-full bg-amber-500"></span>Utilities
					</span>
					<span class="flex items-center gap-1.5">
						<span class="size-2.5 rounded-full bg-red-600"></span>Critical
					</span>
				</div>
			</div>

			<!-- FEED COLUMN -->
			<aside
				class={cn(
					'flex-col bg-background md:flex md:h-full md:w-105 md:shrink-0 md:border-l',
					feedVisible ? 'flex' : 'hidden'
				)}
			>
				<div class="border-b px-5 pb-4 pt-5">
					<div class="flex items-baseline justify-between gap-3">
						<h1 class="font-heading text-2xl font-bold tracking-tight">Live Issue Feed</h1>
						<span class="shrink-0 text-sm text-muted-foreground">
							{issues.length * 62} Issues nearby
						</span>
					</div>

					<div class="mt-4">
						<ToggleGroup.Root
							type="single"
							value={activeRange}
							onValueChange={(v) => (activeRange = (v || '24h') as typeof activeRange)}
							class="flex justify-start gap-2"
						>
							<ToggleGroup.Item value="24h">Past 24h</ToggleGroup.Item>
							<ToggleGroup.Item value="7d">7 Days</ToggleGroup.Item>
							<ToggleGroup.Item value="30d">30 Days</ToggleGroup.Item>
						</ToggleGroup.Root>
					</div>

					<div class="mt-4 grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-1">
							<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Category
							</span>
							<Select.Root type="single" bind:value={category}>
								<Select.Trigger class="w-full">{categoryLabel}</Select.Trigger>
								<Select.Content>
									<Select.Item value="all">All Categories</Select.Item>
									<Select.Item value="infrastructure">Infrastructure</Select.Item>
									<Select.Item value="utilities">Utilities</Select.Item>
									<Select.Item value="parks">Parks & Greenery</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>

						<div class="flex flex-col gap-1">
							<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Status
							</span>
							<Select.Root type="single" bind:value={status}>
								<Select.Trigger class="w-full">{statusLabel}</Select.Trigger>
								<Select.Content>
									<Select.Item value="all">All Statuses</Select.Item>
									<Select.Item value="critical">Critical</Select.Item>
									<Select.Item value="in-progress">In Progress</Select.Item>
									<Select.Item value="open">Open</Select.Item>
									<Select.Item value="submitted">Submitted</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
					</div>
				</div>

				<div class="flex flex-col gap-3 overflow-y-auto p-4 md:min-h-0 md:flex-1">
					{#each issues as issue (issue.id)}
						<article class="flex gap-4 border bg-background p-3">
							<div class="size-20 shrink-0 bg-muted"></div>

							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
									<span class="text-xs font-semibold text-muted-foreground">{issue.id}</span>
									<Button
										variant="outline"
										size="sm"
										class="h-6 gap-1 px-2 text-xs"
										onclick={() => openIssue(issue)}
									>
										<HugeiconsIcon icon={Eye} class="size-3" />
										View
									</Button>

									<span
										class="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide {statusMeta[
											issue.status
										].badge}"
									>
										{statusMeta[issue.status].label}
									</span>
									<span class="ml-auto text-xs text-muted-foreground">{issue.updatedAt}</span>
								</div>

								<h2 class="font-heading mt-1.5 truncate text-base font-bold tracking-tight">
									{issue.title}
								</h2>
								<p class="truncate text-xs text-muted-foreground">
									{issue.category} · {issue.location}
								</p>

								<div class="mt-2.5 flex gap-1.5">
									{#each [1, 2, 3] as seg (seg)}
										<span class="h-1.5 flex-1 {seg <= issue.stage ? 'bg-primary' : 'bg-muted'}"
										></span>
									{/each}
								</div>
							</div>
						</article>
					{/each}
				</div>
			</aside>
		</div>
	</main>

	<footer class="border-t bg-muted/60 py-8">
		<Footer />
	</footer>
</div>

<!-- Issue detail sheet -->
<Sheet.Root bind:open={detailOpen}>
	<Sheet.Content
		side={sheetSide}
		class="flex w-full flex-col gap-0 p-0 sm:max-w-md data-[side=bottom]:h-[88vh] data-[side=bottom]:rounded-t-xl"
	>
		{#if selectedIssue}
			{@const issue = selectedIssue}
			<!-- Header -->
			<div class="shrink-0 border-b px-5 pb-4 pt-5">
				<p class="text-xs font-semibold text-muted-foreground">{issue.id}</p>
				<Sheet.Title class="font-heading text-xl font-bold tracking-tight">
					Issue Details
				</Sheet.Title>
			</div>

			<!-- Scrollable body -->
			<div class="flex-1 space-y-5 overflow-y-auto p-5">
				<div class="space-y-3">
					<span
						class="inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide {statusMeta[
							issue.status
						].badge}"
					>
						{statusMeta[issue.status].label}
					</span>
					<h2 class="font-heading text-2xl font-bold tracking-tight">{issue.title}</h2>
				</div>

				<!-- Photo -->
				<div class="relative">
					<img src={issue.image} alt="" class="h-48 w-full object-cover" />
					{#if issue.verified}
						<span
							class="absolute bottom-2 right-2 flex items-center gap-1 bg-background/90 px-2 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur"
						>
							<HugeiconsIcon icon={CheckmarkBadge01Icon} class="size-3.5 text-primary" />
							Verified Photo
						</span>
					{/if}
				</div>

				<!-- Category + Submitted -->
				<div class="grid grid-cols-2 gap-4">
					<div class="border bg-background p-3">
						<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Category
						</p>
						<p class="mt-1 font-medium">{issue.category}</p>
					</div>
					<div class="border bg-background p-3">
						<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Submitted
						</p>
						<p class="mt-1 font-medium">{issue.updatedAt}</p>
					</div>
				</div>

				<!-- Location -->
				<div class="border bg-background p-3">
					<div class="flex items-center justify-between gap-2">
						<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Location
						</p>
					</div>
					<div class="mt-2 flex items-start gap-2">
						<HugeiconsIcon icon={Location01Icon} class="mt-0.5 size-4 shrink-0 text-primary" />
						<div>
							<p class="font-medium">{issue.location}</p>
							<p class="text-sm text-muted-foreground">Corner intersection at Lincoln Blvd</p>
						</div>
					</div>
					<img
						src={staticMapUrl(issue)}
						alt="Map showing the issue location"
						loading="lazy"
						class="mt-3 h-32 w-full object-cover"
					/>
				</div>

				<!-- Description -->
				<div>
					<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Description
					</p>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{issue.description}</p>
				</div>
			</div>

			<!-- Footer action -->
			<Sheet.Footer class="shrink-0 border-t p-4">
				<Button class="w-full gap-2">
					<HugeiconsIcon icon={ThumbsUpIcon} strokeWidth={2} />
					I have this issue too
				</Button>
			</Sheet.Footer>
		{/if}
	</Sheet.Content>
</Sheet.Root>
