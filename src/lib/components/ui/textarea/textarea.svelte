<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...restProps
	}: WithElementRef<HTMLTextareaAttributes, HTMLTextAreaElement> = $props();
</script>

<textarea
	bind:this={ref}
	data-slot="textarea"
	class={cn(
		'border-input bg-muted/40 focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive placeholder:text-muted-foreground flex min-h-28 w-full border px-3 py-2.5 text-sm transition-[color,border-color] outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	bind:value
	{...restProps}></textarea>
