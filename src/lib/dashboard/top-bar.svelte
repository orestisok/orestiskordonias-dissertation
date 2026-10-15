<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Bell } from '@lucide/svelte';
	import MobileNav from '$lib/dashboard/mobile-nav.svelte';
	import { cn } from '$lib/utils.js';
	import { isActive } from '$lib/dashboard/nav';
	import type { RouteId } from '$app/types';

	const linkClass = (route: RouteId) =>
		cn(
			'font-medium transition-colors',
			isActive(route) ? 'text-primary' : 'text-foreground hover:text-primary'
		);
</script>

<header class="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
	<!-- Left side: logo + primary nav -->
	<div class="flex items-center gap-2.5 md:gap-8">
		<MobileNav />

		<a href={resolve('/submit-report')} class="text-lg font-semibold text-primary"> CivicScan </a>

		<nav class="hidden items-center gap-6 md:flex">
			<a
				href={resolve('/submit-report')}
				class={linkClass('/submit-report')}
				aria-current={isActive('/submit-report') ? 'page' : undefined}
			>
				Submit Report
			</a>
			<a
				href={resolve('/my-reports')}
				class={linkClass('/my-reports')}
				aria-current={isActive('/my-reports') ? 'page' : undefined}
			>
				My Reports
			</a>
			<a
				href={resolve('/public-issues')}
				class={linkClass('/public-issues')}
				aria-current={isActive('/public-issues') ? 'page' : undefined}
			>
				Public Issues
			</a>
		</nav>
	</div>

	<!-- Right side: notifications + account -->
	<div class="flex items-center gap-2">
		<Button variant="ghost" size="icon" aria-label="Notifications" class="relative">
			<Bell class="size-5" />
			<!-- absolute position for red dot -->
			<span class="absolute right-2 top-2 size-2 rounded-full bg-destructive"></span>
		</Button>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				aria-label="Account menu"
			>
				<Avatar.Root class="size-9">
					<Avatar.Image src="" alt="" />
					<Avatar.Fallback>OW</Avatar.Fallback>
				</Avatar.Root>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-48">
				<DropdownMenu.Label>My account</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>Profile</DropdownMenu.Item>
				<DropdownMenu.Item class={isActive('/settings') ? 'text-primary' : undefined}>
					{#snippet child({ props })}
						<a
							{...props}
							href={resolve('/settings')}
							aria-current={isActive('/settings') ? 'page' : undefined}
						>
							Settings
						</a>
					{/snippet}
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<form method="POST" action={resolve('/logout')}>
					<DropdownMenu.Item class="w-full">
						{#snippet child({ props })}
							<button {...props} type="submit">Sign out</button>
						{/snippet}
					</DropdownMenu.Item>
				</form>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>
