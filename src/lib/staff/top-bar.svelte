<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Sheet from '$lib/components/ui/sheet';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { UserIcon } from '@hugeicons/core-free-icons';
	import { LogOut, Menu } from '@lucide/svelte';
	import NavLinks from '$lib/staff/nav-links.svelte';
	import { staffTitle } from '$lib/staff/nav';

	let open = $state(false);
</script>

<header
	class="flex h-16 shrink-0 items-center justify-between gap-4 bg-primary px-4 text-primary-foreground md:px-6"
>
	<div class="flex items-center gap-2">
		<Sheet.Root bind:open>
			<Sheet.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon"
						class="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground md:hidden"
						aria-label="Open menu"
					>
						<Menu class="size-5" />
					</Button>
				{/snippet}
			</Sheet.Trigger>

			<Sheet.Content side="left" class="flex w-72 flex-col gap-0 p-0">
				<Sheet.Header class="border-b p-4">
					<Sheet.Title class="font-heading text-lg font-bold tracking-wide text-primary">
						CIVICSCAN
					</Sheet.Title>
					<Sheet.Description class="text-xs">Worker Portal</Sheet.Description>
				</Sheet.Header>

				<div class="flex-1 p-2">
					<NavLinks onnavigate={() => (open = false)} />
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
			</Sheet.Content>
		</Sheet.Root>

		<h1 class="font-heading text-base font-semibold">{page.data.pageTitle ?? staffTitle()}</h1>
	</div>

	<div class="flex min-w-0 items-center gap-2.5">
		<Avatar.Root class="size-8 after:border-primary-foreground/20">
			<Avatar.Fallback class="bg-primary-foreground text-primary">
				<HugeiconsIcon icon={UserIcon} strokeWidth={2} class="size-5" />
			</Avatar.Fallback>
		</Avatar.Root>
		<span class="hidden truncate text-sm sm:inline">{page.data.user?.name}</span>
	</div>
</header>
