<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { cn } from '$lib/utils.js';
	import { STATUSES, statusMeta } from '$lib/reports';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Image01Icon } from '@hugeicons/core-free-icons';
	import type { ReportStatus } from '$lib/server/db/schema';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const report = $derived(data.report);

	let statusValue = $derived<string>(data.report.status);

	onMount(() => {
		if (page.state.reject && data.report.status !== 'rejected') statusValue = 'rejected';
	});
	let categoryValue = $derived(String(data.report.categoryId));
	let departmentValue = $derived(
		data.report.departmentId === null ? '' : String(data.report.departmentId)
	);

	const rejecting = $derived(statusValue === 'rejected' && report.status !== 'rejected');

	const categoryLabel = $derived(
		data.categories.find((c) => String(c.id) === categoryValue)?.name ?? 'Select a category'
	);
	const departmentLabel = $derived(
		data.departments.find((d) => String(d.id) === departmentValue)?.name ?? 'Unassigned'
	);

	let submitting = $state<string | null>(null);

	function submitWith(section: string, reset = false) {
		return () => {
			submitting = section;
			return async ({ update }: { update: (opts: { reset: boolean }) => Promise<void> }) => {
				await update({ reset });
				submitting = null;
			};
		};
	}

	const message = (section: string) => (form?.section === section ? form : null);
</script>

<svelte:head>
	<title>{data.pageTitle} - CivicScan</title>
</svelte:head>

{#snippet feedback(section: string)}
	{@const result = message(section)}
	{#if result?.message}
		<p class="text-sm text-destructive">{result.message}</p>
	{:else if result && 'success' in result}
		<p class="text-sm text-emerald-700">{result.success}</p>
	{/if}
{/snippet}

<main class="flex flex-1 flex-col gap-4 p-4 md:p-6">
	<a
		href={resolve('/dashboard/queue')}
		class="w-fit text-xs font-semibold text-primary hover:underline"
	>
		← Back to queue
	</a>

	<div class="grid gap-4 lg:grid-cols-[3fr_2fr] lg:items-start md:gap-6">
		<div class="flex flex-col gap-4 md:gap-6">
			<Card.Root size="sm" class="px-5">
				<div>
					<div class="flex items-start justify-between gap-4">
						<h2 class="font-heading text-lg font-semibold">{report.title}</h2>
						<span
							class={cn(
								'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
								statusMeta[report.status].badge
							)}
						>
							{statusMeta[report.status].label}
						</span>
					</div>
					<p class="mt-1 text-xs text-muted-foreground">
						{report.address} · Reported by {report.reporter} · {report.submittedOn}
					</p>
				</div>

				{#if report.photos.length}
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
						{#each report.photos as photo, index (photo)}
							<img
								src={photo}
								alt="Photo {index + 1} of {report.reference}"
								class="aspect-square w-full border object-cover"
							/>
						{/each}
					</div>
				{:else}
					<div
						class="flex h-40 flex-col items-center justify-center gap-2 border border-dashed text-muted-foreground"
					>
						<HugeiconsIcon icon={Image01Icon} strokeWidth={2} class="size-6" />
						<p class="text-sm">No photos were submitted</p>
					</div>
				{/if}

				<p class="text-sm whitespace-pre-line">{report.description}</p>
			</Card.Root>

			<Card.Root size="sm" class="px-5">
				<h2 class="text-sm font-semibold">Status history</h2>
				<ol class="-mt-2 flex flex-col gap-4">
					{#each report.history as event (event.id)}
						<li class="flex gap-3">
							<span
								class="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground"
								style:background-color={event.color}
							></span>
							<div class="min-w-0 text-sm">
								<p>
									<span class="font-semibold">{event.label}</span>
									<span class="text-xs text-muted-foreground">
										· {event.date}{event.actor ? ` · ${event.actor}` : ''}
									</span>
								</p>
								{#if event.body}
									<p class="text-muted-foreground whitespace-pre-line">{event.body}</p>
								{/if}
							</div>
						</li>
					{/each}
				</ol>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-4 md:gap-6">
			<Card.Root size="sm" class="px-5">
				<h2 class="text-sm font-semibold">Update status</h2>
				<form
					method="POST"
					action="?/status"
					class="-mt-2 flex flex-col gap-3"
					use:enhance={submitWith('status')}
				>
					<Select.Root type="single" name="status" bind:value={statusValue}>
						<Select.Trigger class="w-full" aria-label="Status">
							{statusMeta[statusValue as ReportStatus].label}
						</Select.Trigger>
						<Select.Content>
							{#each STATUSES as s (s)}
								<Select.Item value={s}>{statusMeta[s].label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#if rejecting}
						<p class="text-sm text-muted-foreground">
							To reject this report, write the reason in the public update note below.
						</p>
					{/if}
					{@render feedback('status')}
					<Button
						type="submit"
						class="w-full"
						disabled={rejecting || statusValue === report.status || submitting === 'status'}
					>
						Update status
					</Button>
				</form>
			</Card.Root>

			<Card.Root size="sm" class="px-5">
				<h2 class="text-sm font-semibold">Assign</h2>
				<form
					method="POST"
					action="?/assign"
					class="-mt-2 flex flex-col gap-3"
					use:enhance={submitWith('assign')}
				>
					<div class="flex flex-col gap-1">
						<span class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							Category
						</span>
						<Select.Root type="single" name="categoryId" bind:value={categoryValue}>
							<Select.Trigger class="w-full" aria-label="Category">{categoryLabel}</Select.Trigger>
							<Select.Content>
								{#each data.categories as c (c.id)}
									<Select.Item value={String(c.id)}>{c.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							Department
						</span>
						<Select.Root type="single" name="departmentId" bind:value={departmentValue}>
							<Select.Trigger class="w-full" aria-label="Department">
								{departmentLabel}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="">Unassigned</Select.Item>
								{#each data.departments as d (d.id)}
									<Select.Item value={String(d.id)}>{d.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					{@render feedback('assign')}
					<Button
						type="submit"
						class="w-full bg-foreground text-background hover:bg-foreground/90"
						disabled={submitting === 'assign'}
					>
						Save assignment
					</Button>
				</form>
			</Card.Root>

			<Card.Root size="sm" class={cn('px-5', rejecting && 'ring-2 ring-destructive/40')}>
				<div>
					<h2 class="text-sm font-semibold">
						{rejecting ? 'Rejection reason' : 'Public update note'}
					</h2>
					<p class="mt-1 text-xs text-muted-foreground">
						Visible to the citizen and on the public report page.
					</p>
				</div>
				<form
					method="POST"
					action="?/note"
					class="-mt-2 flex flex-col gap-3"
					use:enhance={submitWith('note', true)}
				>
					{#if rejecting}
						<input type="hidden" name="reject" value="on" />
					{/if}
					<Textarea
						name="body"
						rows={4}
						maxlength={2000}
						required
						value={message('note')?.body ?? ''}
						placeholder={rejecting
							? 'e.g. Duplicate of an existing report.'
							: 'e.g. Crew scheduled for Thursday morning.'}
					/>
					{@render feedback('note')}
					<Button
						type="submit"
						class="w-full bg-destructive text-white hover:bg-destructive/90"
						disabled={submitting === 'note'}
					>
						{rejecting ? 'Reject report' : 'Post update'}
					</Button>
				</form>
			</Card.Root>
		</div>
	</div>
</main>
