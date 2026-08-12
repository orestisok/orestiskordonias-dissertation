<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let value = $derived(page.url.pathname.includes('signup') ? 'signup' : 'login');

	function valueChange(next: string) {
		if (next === value) return;
		goto(resolve(next === 'signup' ? '/signup' : '/login'));
	}
</script>

<Tabs.Root {value} onValueChange={valueChange} class="w-full">
	<Tabs.List class="grid w-full grid-cols-2">
		<Tabs.Trigger value="login">Sign in</Tabs.Trigger>
		<Tabs.Trigger value="signup">Create account</Tabs.Trigger>
	</Tabs.List>
</Tabs.Root>
