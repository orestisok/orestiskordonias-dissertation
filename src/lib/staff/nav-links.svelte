<script lang="ts">
	import { resolve } from '$app/paths';
	import { cn } from '$lib/utils.js';
	import { isStaffActive, visibleStaffNav } from '$lib/staff/nav';

	let { onnavigate }: { onnavigate?: () => void } = $props();
</script>

<nav class="flex flex-col gap-1">
	{#each visibleStaffNav() as item (item.route)}
		{@const active = isStaffActive(item.route)}
		<a
			href={resolve(item.route)}
			aria-current={active ? 'page' : undefined}
			onclick={onnavigate}
			class={cn(
				'flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors',
				active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
			)}
		>
			<item.icon class="size-4" />
			{item.label}
		</a>
	{/each}
</nav>
