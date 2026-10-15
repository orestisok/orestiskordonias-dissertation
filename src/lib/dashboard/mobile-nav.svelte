<!-- mobile-nav.svelte -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { cn } from '$lib/utils.js';
	import { isActive } from '$lib/dashboard/nav';
	import type { RouteId } from '$app/types';
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Menu, CirclePlus, FileText, Map, Settings, LogOut } from '@lucide/svelte';

	let open = $state(false);
	const close = () => (open = false);

	const linkClass = (route: RouteId) =>
		cn(
			'flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-colors',
			isActive(route) ? 'bg-accent text-primary' : 'text-foreground hover:bg-accent'
		);
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class="md:hidden" aria-label="Open menu">
				<Menu class="size-5" />
			</Button>
		{/snippet}
	</Sheet.Trigger>

	<Sheet.Content side="left" class="flex w-80 flex-col gap-0 p-0">
		<Sheet.Header class="p-4">
			<Sheet.Title class="text-lg font-semibold text-primary">CivicScan</Sheet.Title>
		</Sheet.Header>

		<!-- Profile  -->
		<div class="flex items-center gap-3 border-b px-4 pb-4">
			<Avatar.Root class="size-11">
				<Avatar.Fallback class="bg-primary/10 text-primary">OW</Avatar.Fallback>
			</Avatar.Root>
			<div class="min-w-0">
				<p class="truncate font-semibold">Mpampis Alexiou</p>
				<p class="truncate text-sm text-muted-foreground">mpampisalexiou@gmail.com</p>
			</div>
		</div>

		<!-- Primary nav -->
		<nav class="flex flex-1 flex-col gap-1 p-4">
			<a
				href={resolve('/submit-report')}
				class={linkClass('/submit-report')}
				aria-current={isActive('/submit-report') ? 'page' : undefined}
				onclick={close}
			>
				<CirclePlus class="size-5" />
				Submit Report
			</a>

			<a
				href={resolve('/my-reports')}
				class={linkClass('/my-reports')}
				aria-current={isActive('/my-reports') ? 'page' : undefined}
				onclick={close}
			>
				<FileText class="size-5" />
				My Reports
			</a>

			<a
				href={resolve('/public-issues')}
				class={linkClass('/public-issues')}
				aria-current={isActive('/public-issues') ? 'page' : undefined}
				onclick={close}
			>
				<Map class="size-5" />
				Public Issues
			</a>

			<div class="my-2 border-t"></div>

			<a
				href={resolve('/settings')}
				class={linkClass('/settings')}
				aria-current={isActive('/settings') ? 'page' : undefined}
				onclick={close}
			>
				<Settings class="size-5" />
				Account Settings
			</a>

			<form method="POST" action={resolve('/logout')}>
				<button
					type="submit"
					class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-accent"
				>
					<LogOut class="size-5" />
					Sign out
				</button>
			</form>
		</nav>

		<!-- Footer -->
		<div class="flex flex-wrap gap-x-4 gap-y-1 border-t p-4 text-sm text-muted-foreground">
			<a href={resolve('/')} onclick={close}>Contact Us</a>
			<a href={resolve('/')} onclick={close}>Privacy Policy</a>
			<a href={resolve('/')} onclick={close}>Terms</a>
			<a href={resolve('/')} onclick={close}>Accessibility</a>
		</div>
	</Sheet.Content>
</Sheet.Root>
