<script lang="ts">
	interface Bar {
		key: string | number;
		label: string;
		count: number;
		color: string;
	}

	let { bars }: { bars: Bar[] } = $props();

	const max = $derived(Math.max(0, ...bars.map((bar) => bar.count)));
</script>

<ul class="flex flex-col gap-4">
	{#each bars as bar (bar.key)}
		<li title="{bar.label}: {bar.count} {bar.count === 1 ? 'report' : 'reports'}">
			<div class="flex items-baseline justify-between gap-3 text-sm">
				<span class="truncate">{bar.label}</span>
				<span class="font-semibold tabular-nums">{bar.count}</span>
			</div>
			<div class="mt-1.5 h-1 bg-muted">
				<div
					class="h-full"
					style:background-color={bar.color}
					style:width="{max ? (bar.count / max) * 100 : 0}%"
				></div>
			</div>
		</li>
	{/each}
</ul>
