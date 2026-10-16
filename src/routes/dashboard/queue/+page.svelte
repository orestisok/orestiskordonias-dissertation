<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Select from '$lib/components/ui/select';
	import { cn } from '$lib/utils.js';
	import { STATUSES, statusMeta } from '$lib/reports';
	import type { ReportStatus } from '$lib/server/db/schema';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type Report = (typeof data.reports)[number];

	let category = $state('all');
	let status = $state('all');
	let department = $state('all');

	const categoryById = $derived(new Map(data.categories.map((c) => [c.id, c])));
	const departmentById = $derived(new Map(data.departments.map((d) => [d.id, d])));

	const categoryLabel = $derived(
		category === 'all' ? 'All categories' : (categoryById.get(Number(category))?.name ?? '')
	);
	const statusLabel = $derived(
		status === 'all' ? 'All statuses' : statusMeta[status as ReportStatus].label
	);
	const departmentLabel = $derived(
		department === 'all'
			? 'All departments'
			: department === 'none'
				? 'Unassigned'
				: (departmentById.get(Number(department))?.name ?? '')
	);

	const visibleReports = $derived(
		data.reports.filter(
			(r) =>
				(category === 'all' || String(r.categoryId) === category) &&
				(status === 'all' || r.status === status) &&
				(department === 'all' ||
					(department === 'none' ? r.departmentId === null : String(r.departmentId) === department))
		)
	);

	const forms: Record<string, HTMLFormElement> = {};
	let pending = $state<string | null>(null);

	function reportHref(report: Report) {
		return resolve('/dashboard/queue/[reference]', { reference: String(report.referenceNumber) });
	}

	function onStatusChange(report: Report, value: string) {
		if (value === report.status) return;
		if (value === 'rejected') {
			goto(reportHref(report), { state: { reject: true } });
			return;
		}
		const formEl = forms[report.id];
		(formEl.elements.namedItem('status') as HTMLInputElement).value = value;
		formEl.requestSubmit();
	}
</script>

<svelte:head>
	<title>Reports Queue - CivicScan</title>
</svelte:head>

<main class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
	<div
		class="flex flex-wrap items-center gap-x-4 gap-y-2 bg-card px-5 py-3 shadow-sm ring-1 ring-foreground/5"
	>
		<Select.Root type="single" bind:value={category}>
			<Select.Trigger class="w-48">{categoryLabel}</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">All categories</Select.Item>
				{#each data.categories as c (c.id)}
					<Select.Item value={String(c.id)}>{c.name}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<Select.Root type="single" bind:value={status}>
			<Select.Trigger class="w-40">{statusLabel}</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">All statuses</Select.Item>
				{#each STATUSES as s (s)}
					<Select.Item value={s}>{statusMeta[s].label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<Select.Root type="single" bind:value={department}>
			<Select.Trigger class="w-48">{departmentLabel}</Select.Trigger>
			<Select.Content>
				<Select.Item value="all">All departments</Select.Item>
				<Select.Item value="none">Unassigned</Select.Item>
				{#each data.departments as d (d.id)}
					<Select.Item value={String(d.id)}>{d.name}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<span class="ml-auto text-sm text-muted-foreground">
			{visibleReports.length}
			{visibleReports.length === 1 ? 'report' : 'reports'}
		</span>
	</div>

	{#if form?.message}
		<p class="border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
			{form.message}
		</p>
	{/if}

	<div class="relative overflow-x-auto bg-card shadow-sm ring-1 ring-foreground/5">
		<table class="w-full text-sm">
			<thead>
				<tr
					class="bg-muted/50 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
				>
					<th class="px-5 py-3">ID</th>
					<th class="px-5 py-3">Title</th>
					<th class="px-5 py-3">Category</th>
					<th class="px-5 py-3">Department</th>
					<th class="px-5 py-3">Submitted</th>
					<th class="px-5 py-3">Status</th>
					<th class="px-5 py-3"><span class="sr-only">Actions</span></th>
				</tr>
			</thead>
			<tbody>
				{#each visibleReports as report (report.id)}
					{@const reportCategory = categoryById.get(report.categoryId)}
					<tr class="border-t">
						<td class="px-5 py-3 font-semibold whitespace-nowrap">{report.reference}</td>
						<td class="max-w-80 px-5 py-3">
							<p class="truncate" title={report.title}>{report.title}</p>
							<p class="truncate text-xs text-muted-foreground" title={report.address}>
								{report.address}
							</p>
						</td>
						<td class="px-5 py-3 whitespace-nowrap">
							<span class="flex items-center gap-2">
								<span
									class="size-2 shrink-0 rounded-full"
									style:background-color={reportCategory?.color}
								></span>
								{reportCategory?.name}
							</span>
						</td>
						<td class="px-5 py-3 whitespace-nowrap">
							{#if report.departmentId !== null}
								{departmentById.get(report.departmentId)?.name}
							{:else}
								<span class="text-muted-foreground">Unassigned</span>
							{/if}
						</td>
						<td class="px-5 py-3 whitespace-nowrap text-muted-foreground">
							{report.submittedOn}
						</td>
						<td class="px-5 py-3">
							<form
								method="POST"
								action="?/status"
								bind:this={forms[report.id]}
								use:enhance={() => {
									pending = report.id;
									return async ({ update }) => {
										await update({ reset: false });
										pending = null;
									};
								}}
							>
								<input type="hidden" name="reportId" value={report.id} />
								<input type="hidden" name="status" value={report.status} />
								<Select.Root
									type="single"
									value={report.status}
									onValueChange={(value) => onStatusChange(report, value)}
									disabled={pending === report.id}
								>
									<Select.Trigger
										size="sm"
										aria-label="Status of {report.reference}"
										class={cn(
											'h-8 w-36 border-none px-2.5 text-xs font-semibold',
											statusMeta[report.status].badge
										)}
									>
										{statusMeta[report.status].label}
									</Select.Trigger>
									<Select.Content>
										{#each STATUSES as s (s)}
											<Select.Item value={s}>{statusMeta[s].label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</form>
						</td>
						<td class="px-5 py-3 text-right whitespace-nowrap">
							<a
								href={reportHref(report)}
								class="text-xs font-semibold text-primary hover:underline"
							>
								Open →
							</a>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="7" class="px-5 py-10 text-center text-muted-foreground">
							{data.reports.length ? 'No reports match these filters.' : 'No reports yet.'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</main>
