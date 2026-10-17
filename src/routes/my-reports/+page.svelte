<script lang="ts">
	import TopBar from '$lib/dashboard/top-bar.svelte';
	import Footer from '$lib/dashboard/footer.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { PlusSignIcon, PencilEdit02Icon, Image01Icon } from '@hugeicons/core-free-icons';
	import { statusMeta } from '$lib/reports';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type ReportStatus = (typeof data.reports)[number]['status'];

	let activeFilter = $state<'all' | ReportStatus>('all');

	const counts = $derived({
		all: data.reports.length,
		acknowledged: data.reports.filter((report) => report.status === 'acknowledged').length,
		in_progress: data.reports.filter((report) => report.status === 'in_progress').length,
		resolved: data.reports.filter((report) => report.status === 'resolved').length
	});

	const visibleReports = $derived(
		activeFilter === 'all'
			? data.reports
			: data.reports.filter((report) => report.status === activeFilter)
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
				<ToggleGroup.Item value="in_progress">In Progress ({counts.in_progress})</ToggleGroup.Item>
				<ToggleGroup.Item value="resolved">Resolved ({counts.resolved})</ToggleGroup.Item>
			</ToggleGroup.Root>
		</div>

		<div class="mt-10 flex flex-col gap-4">
			{#each visibleReports as report (report.id)}
				<article
					id={report.reference}
					class="bg-background flex scroll-mt-6 flex-col gap-5 border p-4 sm:flex-row md:p-5"
				>
					{#if report.image}
						<img
							src={report.image}
							alt={report.title}
							loading="lazy"
							class="h-40 w-full shrink-0 object-cover sm:size-32"
						/>
					{:else}
						<div
							class="bg-muted text-muted-foreground flex h-40 w-full shrink-0 items-center justify-center sm:size-32"
						>
							<HugeiconsIcon icon={Image01Icon} strokeWidth={2} class="size-6" />
						</div>
					{/if}

					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
							<span class="text-muted-foreground text-sm font-semibold">{report.reference}</span>
							<span
								class="px-2 py-0.5 text-xs font-semibold tracking-wide uppercase {statusMeta[
									report.status
								].badge}"
							>
								{statusMeta[report.status].label}
							</span>
							<span class="text-muted-foreground text-xs">{report.updatedAgo}</span>
							{#if report.status === 'submitted'}
								<Button
									variant="outline"
									size="sm"
									class="ml-auto"
									href="/my-reports/{report.referenceNumber}/edit"
								>
									<HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
									Edit
								</Button>
							{/if}
						</div>

						<h2 class="font-heading mt-2 text-xl font-bold tracking-tight">{report.title}</h2>
						<p
							class="text-muted-foreground mt-1 truncate text-sm"
							title={report.address ?? undefined}
						>
							{[report.category, report.address?.split(',')[0]].filter(Boolean).join(' · ')}
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

						{#if report.note}
							<div class="bg-muted/50 border-primary mt-3 border-l-2 px-4 py-3">
								<p class="text-muted-foreground text-sm italic">"{report.note}"</p>
							</div>
						{/if}
					</div>
				</article>
			{:else}
				<div class="bg-background flex flex-col items-center gap-4 border px-6 py-12 text-center">
					{#if data.reports.length}
						<p class="text-muted-foreground">No reports with this status.</p>
					{:else}
						<p class="text-muted-foreground">You haven't submitted any reports yet.</p>
						<Button href="/submit-report">
							<HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
							Submit Your First Report
						</Button>
					{/if}
				</div>
			{/each}
		</div>
	</main>

	<footer class="bg-muted/60 border-t py-8">
		<Footer />
	</footer>
</div>
