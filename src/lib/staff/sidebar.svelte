<script lang="ts">
	import { resolve } from '$app/paths';
	import { LogOut } from '@lucide/svelte';
	import NavLinks from '$lib/staff/nav-links.svelte';
</script>

<aside class="hidden w-60 shrink-0 flex-col border-r bg-background md:flex">
	<div class="border-b px-4 py-4">
		<p class="font-heading text-lg font-bold tracking-wide text-primary">CIVICSCAN</p>
		<p class="text-xs text-muted-foreground">Worker Portal</p>
	</div>

	<div class="flex-1 p-2">
		<NavLinks />
	</div>

	<form method="POST" action={resolve('/logout')} class="border-t p-2">
		<button
			type="submit"
			class="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
		>
			<LogOut class="size-4" />
			Log out
		</button>
	</form>
</aside>
