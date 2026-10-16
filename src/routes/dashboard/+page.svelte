<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card';
	import BarList from '$lib/staff/bar-list.svelte';
	import ReportPopup from '$lib/staff/report-popup.svelte';
	import { cn } from '$lib/utils.js';
	import { statusMeta } from '$lib/reports';
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { mount, onMount, unmount } from 'svelte';
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESS_TOKEN;

	const stats = $derived([
		{ label: 'Open Reports', value: data.stats.open, tone: 'text-foreground' },
		{ label: 'New / Submitted', value: data.stats.submitted, tone: 'text-muted-foreground' },
		{ label: 'In Progress', value: data.stats.inProgress, tone: 'text-primary' },
		{ label: 'Resolved (30d)', value: data.stats.resolved30d, tone: 'text-emerald-700' }
	]);

	const defaultCenter: [number, number] = [22.9444, 40.6401];
	let mapContainer: HTMLDivElement;
	let selectedId = $state<string | null>(null);

	onMount(() => {
		const map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/light-v11',
			center: defaultCenter,
			zoom: 13
		});
		map.addControl(new mapboxgl.NavigationControl(), 'top-right');

		if (data.points.length) {
			const bounds = new mapboxgl.LngLatBounds();
			for (const point of data.points) bounds.extend([point.lng, point.lat]);
			map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 });
		}

		const popup = new mapboxgl.Popup({
			offset: 28,
			maxWidth: 'none',
			className: 'staff-popup',
			anchor: 'bottom',
			focusAfterOpen: false
		});
		let content: ReturnType<typeof mount> | null = null;

		const clearContent = () => {
			if (content) unmount(content);
			content = null;
		};

		popup.on('close', () => {
			clearContent();
			selectedId = null;
		});

		for (const point of data.points) {
			const marker = new mapboxgl.Marker({ color: point.color, scale: 0.8 })
				.setLngLat([point.lng, point.lat])
				.addTo(map);
			const element = marker.getElement();
			element.title = `${point.reference} · ${point.title}`;
			element.style.cursor = 'pointer';
			element.addEventListener('click', (e) => {
				e.stopPropagation();
				popup.remove();
				const target = document.createElement('div');
				content = mount(ReportPopup, { target, props: { point } });
				popup.setLngLat([point.lng, point.lat]).setDOMContent(target).addTo(map);
				selectedId = point.id;
				map.easeTo({ center: [point.lng, point.lat], offset: [0, 70] });
			});
		}

		return () => {
			clearContent();
			map.remove();
		};
	});
</script>

<svelte:head>
	<title>Dashboard - CivicScan</title>
</svelte:head>

<main class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
	<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
		{#each stats as stat (stat.label)}
			<Card.Root size="sm" class="px-5">
				<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					{stat.label}
				</p>
				<p class={cn('-mt-3 font-heading text-3xl font-bold', stat.tone)}>{stat.value}</p>
			</Card.Root>
		{/each}
	</div>

	<div class="grid gap-4 md:gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
		<Card.Root size="sm" class="px-5">
			<h2 class="text-sm font-semibold">Reported Issues Map</h2>
			<div class="-mt-2 h-80 border md:h-96">
				<div bind:this={mapContainer} class="h-full w-full"></div>
			</div>
			<ul class="-mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
				{#each data.categories as category (category.id)}
					<li class="flex items-center gap-1.5">
						<span class="size-2.5 rounded-full" style:background-color={category.color}></span>
						{category.name}
					</li>
				{/each}
			</ul>
		</Card.Root>

		<Card.Root size="sm" class="px-5">
			<h2 class="text-sm font-semibold">By Category</h2>
			<div class="-mt-1">
				<BarList
					bars={data.categories.map((c) => ({
						key: c.id,
						label: c.name,
						count: c.count,
						color: c.color
					}))}
				/>
			</div>
		</Card.Root>
	</div>

	<Card.Root size="sm" class="gap-0 pb-0">
		<div class="flex items-center justify-between gap-4 border-b px-5 pb-4">
			<h2 class="text-sm font-semibold">Recent Reports</h2>
			<a
				href={resolve('/dashboard/queue')}
				class="text-xs font-semibold text-primary hover:underline"
			>
				View all →
			</a>
		</div>

		{#if data.recent.length}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr
							class="text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
						>
							<th class="px-5 py-3">ID</th>
							<th class="px-5 py-3">Title</th>
							<th class="px-5 py-3">Category</th>
							<th class="px-5 py-3">Address</th>
							<th class="px-5 py-3">Status</th>
							<th class="px-5 py-3">Submitted</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recent as report (report.id)}
							<tr
								class={cn(
									'border-t transition-colors',
									report.id === selectedId && 'bg-primary/10 shadow-[inset_3px_0_0_var(--primary)]'
								)}
							>
								<td class="px-5 py-3 font-semibold whitespace-nowrap text-primary">
									<a
										href={resolve('/dashboard/queue/[reference]', {
											reference: String(report.referenceNumber)
										})}
										class="hover:underline"
									>
										{report.reference}
									</a>
								</td>
								<td class="max-w-64 truncate px-5 py-3" title={report.title}>{report.title}</td>
								<td class="px-5 py-3 whitespace-nowrap">{report.category}</td>
								<td class="max-w-64 truncate px-5 py-3" title={report.address}>
									{report.address}
								</td>
								<td class="px-5 py-3">
									<span
										class={cn(
											'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
											statusMeta[report.status].badge
										)}
									>
										{statusMeta[report.status].label}
									</span>
								</td>
								<td class="px-5 py-3 whitespace-nowrap text-muted-foreground">
									{report.submittedOn}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="px-5 py-8 text-center text-sm text-muted-foreground">No reports yet</p>
		{/if}
	</Card.Root>
</main>

<style>
	:global(.staff-popup .mapboxgl-popup-content) {
		padding: 0;
		border-radius: 0;
		overflow: hidden;
	}

	:global(.staff-popup .mapboxgl-popup-close-button) {
		width: 1.5rem;
		height: 1.5rem;
		background: rgb(255 255 255 / 0.9);
		font-size: 1rem;
		line-height: 1;
	}
</style>
