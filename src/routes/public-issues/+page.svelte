<script lang="ts">
	import TopBar from '$lib/dashboard/top-bar.svelte';
	import Footer from '$lib/dashboard/footer.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { statusMeta } from '$lib/reports';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Eye, Location01Icon, Image01Icon } from '@hugeicons/core-free-icons';
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { onMount } from 'svelte';
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESS_TOKEN;

	type Issue = (typeof data.issues)[number];
	type Status = Issue['status'];

	const filterStatuses: Status[] = ['submitted', 'acknowledged', 'in_progress', 'resolved'];

	type ViewMode = 'split' | 'map' | 'list';
	let view = $state<ViewMode>('split');

	const mapVisible = $derived(view !== 'list');
	const feedVisible = $derived(view !== 'map');

	type Range = 'all' | '24h' | '7d' | '30d';
	const rangeMs: Record<Exclude<Range, 'all'>, number> = {
		'24h': 86_400_000,
		'7d': 7 * 86_400_000,
		'30d': 30 * 86_400_000
	};
	const now = Date.now();

	let activeRange = $state<Range>('all');
	let category = $state('all');
	let status = $state('all');

	const categoryLabel = $derived(
		data.categories.find((c) => String(c.id) === category)?.name ?? 'All Categories'
	);
	const statusLabel = $derived(
		status === 'all' ? 'All Statuses' : statusMeta[status as Status].label
	);

	const visibleIssues = $derived(
		data.issues.filter(
			(issue) =>
				(activeRange === 'all' || issue.createdAt >= now - rangeMs[activeRange]) &&
				(category === 'all' || String(issue.categoryId) === category) &&
				(status === 'all' || issue.status === status)
		)
	);

	const defaultCenter: [number, number] = [22.9444, 40.6401];

	let map: mapboxgl.Map | undefined;
	let mapReady = $state(false);
	let mapContainer: HTMLDivElement;
	let markers: Record<string, mapboxgl.Marker> = {};

	onMount(() => {
		const m = new mapboxgl.Map({ container: mapContainer, center: defaultCenter, zoom: 13 });
		m.addControl(new mapboxgl.NavigationControl(), 'top-right');

		if (data.issues.length) {
			const bounds = new mapboxgl.LngLatBounds();
			for (const issue of data.issues) bounds.extend([issue.lng, issue.lat]);
			m.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 });
		}

		map = m;
		mapReady = true;

		return () => {
			markers = {};
			m.remove();
			map = undefined;
			mapReady = false;
		};
	});

	$effect(() => {
		if (!mapReady || !map) return;

		const ids = new Set(visibleIssues.map((issue) => issue.id));
		for (const [id, marker] of Object.entries(markers)) {
			if (!ids.has(id)) {
				marker.remove();
				delete markers[id];
			}
		}

		for (const issue of visibleIssues) {
			if (markers[issue.id]) continue;
			const marker = new mapboxgl.Marker({ color: statusMeta[issue.status].color })
				.setLngLat([issue.lng, issue.lat])
				.addTo(map);
			const element = marker.getElement();
			element.style.cursor = 'pointer';
			element.title = `${issue.reference}: ${issue.title}`;
			element.addEventListener('click', (e) => {
				e.stopPropagation();
				openIssue(issue);
			});
			markers[issue.id] = marker;
		}
	});

	$effect(() => {
		if (mapVisible && map) {
			requestAnimationFrame(() => map?.resize());
		}
	});

	let detailOpen = $state(false);
	let selectedIssue = $state<Issue | null>(null);
	let activePhoto = $state(0);

	function openIssue(issue: Issue) {
		selectedIssue = issue;
		activePhoto = 0;
		detailOpen = true;
		if (mapVisible) map?.easeTo({ center: [issue.lng, issue.lat] });
	}

	let innerWidth = $state(0);
	const sheetSide = $derived(innerWidth >= 768 ? 'right' : 'bottom');

	function staticMapUrl(issue: Issue) {
		const color = statusMeta[issue.status].color.replace('#', '');
		return (
			`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
			`pin-s+${color}(${issue.lng},${issue.lat})/${issue.lng},${issue.lat},14/500x220@2x` +
			`?access_token=${PUBLIC_MAPBOX_ACCESS_TOKEN}`
		);
	}

	function street(issue: Issue) {
		return issue.address?.split(',')[0] ?? `${issue.lat.toFixed(5)}, ${issue.lng.toFixed(5)}`;
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
			<div
				class={cn(
					'relative md:block md:h-full md:flex-1',
					mapVisible ? (view === 'map' ? 'block h-[calc(100vh-8rem)]' : 'block h-80') : 'hidden'
				)}
			>
				<div bind:this={mapContainer} class="h-full w-full"></div>

				<div
					class="absolute top-3 right-14 left-3 flex flex-wrap items-center gap-x-3 gap-y-1 md:top-auto md:right-auto md:bottom-4 md:left-4 md:gap-x-4 border bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur"
				>
					{#each filterStatuses as s (s)}
						<span class="flex items-center gap-1.5">
							<span class="size-2.5 rounded-full" style:background-color={statusMeta[s].color}
							></span>{statusMeta[s].label}
						</span>
					{/each}
				</div>
			</div>

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
							{visibleIssues.length}
							{visibleIssues.length === 1 ? 'issue' : 'issues'}
						</span>
					</div>

					<div class="mt-4">
						<ToggleGroup.Root
							type="single"
							value={activeRange}
							onValueChange={(v) => (activeRange = (v || 'all') as Range)}
							class="grid w-full grid-cols-4 gap-1"
						>
							<ToggleGroup.Item value="all" class="px-1">All Time</ToggleGroup.Item>
							<ToggleGroup.Item value="24h" class="px-1">24 Hours</ToggleGroup.Item>
							<ToggleGroup.Item value="7d" class="px-1">7 Days</ToggleGroup.Item>
							<ToggleGroup.Item value="30d" class="px-1">30 Days</ToggleGroup.Item>
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
									{#each data.categories as c (c.id)}
										<Select.Item value={String(c.id)}>{c.name}</Select.Item>
									{/each}
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
									{#each filterStatuses as s (s)}
										<Select.Item value={s}>{statusMeta[s].label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					</div>
				</div>

				<div class="flex flex-col gap-3 overflow-y-auto p-4 md:min-h-0 md:flex-1">
					{#each visibleIssues as issue (issue.id)}
						<article class="flex gap-4 border bg-background p-3">
							{#if issue.photos[0]}
								<img
									src={issue.photos[0]}
									alt={issue.title}
									loading="lazy"
									class="size-20 shrink-0 object-cover"
								/>
							{:else}
								<div
									class="flex size-20 shrink-0 items-center justify-center bg-muted text-muted-foreground"
								>
									<HugeiconsIcon icon={Image01Icon} strokeWidth={2} class="size-5" />
								</div>
							{/if}

							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
									<span class="text-xs font-semibold text-muted-foreground">{issue.reference}</span>
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
									<span class="ml-auto text-xs text-muted-foreground">{issue.updatedAgo}</span>
								</div>

								<h2 class="font-heading mt-1.5 truncate text-base font-bold tracking-tight">
									{issue.title}
								</h2>
								<p class="truncate text-xs text-muted-foreground">
									{issue.category} · {street(issue)}
								</p>

								<div class="mt-2.5 flex gap-1.5">
									{#each [1, 2, 3, 4] as seg (seg)}
										<span
											class="h-1.5 flex-1 {seg <= statusMeta[issue.status].stage
												? 'bg-primary'
												: 'bg-muted'}"
										></span>
									{/each}
								</div>
							</div>
						</article>
					{:else}
						<p class="border bg-background px-4 py-10 text-center text-sm text-muted-foreground">
							{data.issues.length
								? 'No issues match these filters.'
								: 'No issues have been reported yet.'}
						</p>
					{/each}
				</div>
			</aside>
		</div>
	</main>

	<footer class="border-t bg-muted/60 py-8">
		<Footer />
	</footer>
</div>

<Sheet.Root bind:open={detailOpen}>
	<Sheet.Content
		side={sheetSide}
		class="flex w-full flex-col gap-0 p-0 sm:max-w-md data-[side=bottom]:h-[88vh] data-[side=bottom]:rounded-t-xl"
	>
		{#if selectedIssue}
			{@const issue = selectedIssue}
			<div class="shrink-0 border-b px-5 pb-4 pt-5">
				<p class="text-xs font-semibold text-muted-foreground">{issue.reference}</p>
				<Sheet.Title class="font-heading text-xl font-bold tracking-tight"
					>Issue Details</Sheet.Title
				>
			</div>

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

				{#if issue.photos.length}
					<div class="space-y-2">
						<img
							src={issue.photos[activePhoto]}
							alt="Photo {activePhoto + 1} of {issue.reference}"
							class="h-48 w-full object-cover"
						/>
						{#if issue.photos.length > 1}
							<div class="flex gap-2">
								{#each issue.photos as url, i (url)}
									<button
										type="button"
										aria-label="Show photo {i + 1}"
										class="size-14 border {i === activePhoto ? 'ring-2 ring-primary' : ''}"
										onclick={() => (activePhoto = i)}
									>
										<img src={url} alt="" class="size-full object-cover" />
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{:else}
					<div
						class="flex h-48 flex-col items-center justify-center gap-2 bg-muted text-sm text-muted-foreground"
					>
						<HugeiconsIcon icon={Image01Icon} strokeWidth={2} class="size-8" />
						No photos attached
					</div>
				{/if}

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
						<p class="mt-1 font-medium">{issue.submittedAgo}</p>
						<p class="text-xs text-muted-foreground">{issue.submittedOn}</p>
					</div>
				</div>

				<div class="border bg-background p-3">
					<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</p>
					<div class="mt-2 flex items-start gap-2">
						<HugeiconsIcon icon={Location01Icon} class="mt-0.5 size-4 shrink-0 text-primary" />
						<div class="min-w-0">
							<p class="font-medium">{street(issue)}</p>
							{#if issue.address?.includes(',')}
								<p class="text-sm text-muted-foreground">
									{issue.address.slice(issue.address.indexOf(',') + 1).trim()}
								</p>
							{/if}
						</div>
					</div>
					<img
						src={staticMapUrl(issue)}
						alt="Map showing the issue location"
						loading="lazy"
						class="mt-3 h-32 w-full object-cover"
					/>
				</div>

				<div>
					<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Description
					</p>
					<p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
						{issue.description}
					</p>
				</div>

				{#if issue.updates.length}
					<div>
						<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Updates</p>
						<ol class="mt-3 space-y-4 border-l pl-5">
							{#each issue.updates as update (update.id)}
								<li class="relative">
									<span
										class="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-primary ring-4 ring-background"
									></span>
									<p class="text-sm font-medium">{update.label}</p>
									<p class="text-xs text-muted-foreground">
										{update.date}{update.author ? ` · ${update.author}` : ''}
									</p>
									{#if update.body}
										<p class="mt-1 text-sm italic text-muted-foreground">"{update.body}"</p>
									{/if}
								</li>
							{/each}
						</ol>
					</div>
				{/if}
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
