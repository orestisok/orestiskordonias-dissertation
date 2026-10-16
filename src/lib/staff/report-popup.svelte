<script lang="ts">
	import { resolve } from '$app/paths';
	import { cn } from '$lib/utils.js';
	import { statusMeta } from '$lib/reports';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Image01Icon } from '@hugeicons/core-free-icons';
	import type { ReportStatus } from '$lib/server/db/schema';

	interface Point {
		referenceNumber: number;
		reference: string;
		title: string;
		address: string;
		status: ReportStatus;
		category: string;
		submittedOn: string;
		image: string | null;
	}

	let { point }: { point: Point } = $props();
</script>

<div class="flex w-72 max-w-[calc(100vw-6rem)] bg-card font-sans text-card-foreground">
	{#if point.image}
		<img src={point.image} alt={point.title} class="w-24 shrink-0 object-cover" />
	{:else}
		<div class="flex w-24 shrink-0 items-center justify-center bg-muted text-muted-foreground">
			<HugeiconsIcon icon={Image01Icon} strokeWidth={2} class="size-6" />
		</div>
	{/if}

	<div class="flex min-w-0 flex-1 flex-col gap-0.5 p-2.5 pr-7">
		<div class="flex items-center gap-2">
			<span class="text-xs font-semibold text-primary">{point.reference}</span>
			<span
				class={cn(
					'rounded-full px-2 py-px text-[10px] font-semibold',
					statusMeta[point.status].badge
				)}
			>
				{statusMeta[point.status].label}
			</span>
		</div>
		<p class="line-clamp-2 text-sm leading-snug font-semibold">{point.title}</p>
		<p class="truncate text-xs text-muted-foreground" title="{point.category} · {point.address}">
			{point.category} · {point.address}
		</p>
		<p class="text-xs text-muted-foreground">{point.submittedOn}</p>
		<a
			href={resolve('/dashboard/queue/[reference]', { reference: String(point.referenceNumber) })}
			class="mt-1 text-xs font-semibold text-primary hover:underline"
		>
			Open report →
		</a>
	</div>
</div>
