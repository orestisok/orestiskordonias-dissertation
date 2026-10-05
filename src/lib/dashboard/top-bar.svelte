<script lang="ts">
	import { resolve } from '$app/paths';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Search, Bell } from '@lucide/svelte';
	import MobileNav from '$lib/dashboard/mobile-nav.svelte';
</script>

<header class="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
	<!-- Left side: logo + primary nav -->
	<div class="flex items-center gap-2.5 md:gap-8">
		<MobileNav />

		<a href={resolve('/submit-report')} class="text-lg font-semibold text-primary"> CivicScan </a>

		<nav class="hidden items-center gap-6 md:flex">
			<!-- TODO: UPDATE ROUTING -->
			<a href={resolve('/submit-report')}> Submit Report </a>
			<a href={resolve('/my-reports')}> My Reports </a>
			<a href={resolve('/public-issues')}> Public Issues </a>
		</nav>
	</div>

	<!-- Right side: search + notifications + account -->
	<div class="flex items-center gap-2">
		<div class="relative hidden sm:block">
			<Search
				class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
			/>
			<Input type="search" placeholder="Search reports..." class="w-40 pl-8 md:w-40 lg:w-56" />
		</div>

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
				<DropdownMenu.Item>Settings</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>Sign out</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>
