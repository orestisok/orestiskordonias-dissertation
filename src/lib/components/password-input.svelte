<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';

	interface Props {
		id: string;
		value?: string;
		showPassword?: boolean;
		placeholder?: string;
		required?: boolean;
	}

	let {
		id,
		value = $bindable(''),
		showPassword = $bindable(false),
		placeholder = 'Enter your password',
		required = true
	}: Props = $props();
</script>

<div class="relative">
	<Input
		{id}
		type={showPassword ? 'text' : 'password'}
		class="border-2 border-input pl-2 pr-16"
		{placeholder}
		{required}
		bind:value
	/>

	<button
		type="button"
		onclick={() => (showPassword = !showPassword)}
		class="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
		aria-label={showPassword ? 'Hide password' : 'Show password'}
	>
		{showPassword ? 'HIDE' : 'SHOW'}
	</button>
</div>
