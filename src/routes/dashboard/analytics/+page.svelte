<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import BarList from '$lib/staff/bar-list.svelte';
	import { cn } from '$lib/utils.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const stats = $derived([
		{ label: 'Total Reports', value: String(data.stats.total), tone: 'text-foreground' },
		{
			label: 'Resolved Rate',
			value: data.stats.resolvedRate === null ? '—' : `${data.stats.resolvedRate}%`,
			tone: 'text-emerald-700'
		},
		{
			label: 'Avg Days Open',
			value: data.stats.avgDaysOpen === null ? '—' : String(data.stats.avgDaysOpen),
			tone: 'text-foreground'
		},
		{ label: 'Rejected', value: String(data.stats.rejected), tone: 'text-destructive' }
	]);

	const weekMax = $derived(Math.max(0, ...data.weeks.map((w) => w.count)));

	const reports = (n: number) => `${n} ${n === 1 ? 'report' : 'reports'}`;
</script>

<svelte:head>
	<title>Analytics - CivicScan</title>
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

	<div class="grid gap-4 md:gap-6 lg:grid-cols-2 lg:items-start">
		<Card.Root size="sm" class="px-5">
			<h2 class="text-sm font-semibold">Reports by category</h2>
			<div class="-mt-1"><BarList bars={data.byCategory} /></div>
		</Card.Root>

		<Card.Root size="sm" class="px-5">
			<h2 class="text-sm font-semibold">Reports by status</h2>
			<div class="-mt-1"><BarList bars={data.byStatus} /></div>
		</Card.Root>
	</div>

	<div class="grid gap-4 md:gap-6 lg:grid-cols-[4fr_5fr] lg:items-start">
		<Card.Root size="sm" class="px-5">
			<h2 class="text-sm font-semibold">Reports by department</h2>
			<div class="-mt-1"><BarList bars={data.byDepartment} /></div>
		</Card.Root>

		<Card.Root size="sm" class="px-5">
			<h2 class="text-sm font-semibold">Submissions, last {data.weeks.length} weeks</h2>
			<ul class="-mt-1 flex gap-2 sm:gap-3">
				{#each data.weeks as week, index (week.key)}
					{@const current = index === data.weeks.length - 1}
					<li
						class="group flex min-w-0 flex-1 flex-col"
						title="{current ? 'This week' : `Week of ${week.label}`}: {reports(week.count)}"
					>
						<div class="flex h-48 flex-col justify-end border-b">
							<span class="mb-1 text-center text-xs text-muted-foreground tabular-nums">
								{week.count}
							</span>
							<div
								class="bg-primary transition-opacity group-hover:opacity-80"
								style:height="{weekMax ? (week.count / weekMax) * 85 : 0}%"
							></div>
						</div>
						<span class="mt-2 text-center text-xs text-muted-foreground">
							{current ? 'This week' : week.label}
						</span>
					</li>
				{/each}
			</ul>
		</Card.Root>
	</div>
</main>
