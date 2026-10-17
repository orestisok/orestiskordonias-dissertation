<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Bell } from '@lucide/svelte';
	import MobileNav from '$lib/dashboard/mobile-nav.svelte';
	import { cn } from '$lib/utils.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { UserIcon } from '@hugeicons/core-free-icons';
	import { isActive } from '$lib/dashboard/nav';
	import { page } from '$app/state';
	import { invalidate } from '$app/navigation';
	import type { Notification } from '$lib/server/notifications';
	import type { RouteId } from '$app/types';

	const notifications = $derived(
		page.data.notifications as { items: Notification[]; unreadCount: number } | null | undefined
	);
	let highlighted = $state(new Set<string>());

	async function openNotifications(open: boolean) {
		if (!open || !notifications) return;
		highlighted = new Set(notifications.items.filter((n) => n.unread).map((n) => n.id));
		if (!notifications.unreadCount) return;

		const response = await fetch(resolve('/notifications/read'), { method: 'POST' });
		if (response.ok) await invalidate('app:notifications');
	}

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
		{#if notifications}
			<DropdownMenu.Root onOpenChange={openNotifications}>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							size="icon"
							aria-label={notifications.unreadCount
								? `Notifications, ${notifications.unreadCount} unread`
								: 'Notifications'}
							class="relative"
						>
							<Bell class="size-5" />
							{#if notifications.unreadCount}
								<span class="absolute right-2 top-2 size-2 rounded-full bg-destructive"></span>
							{/if}
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="max-h-[28rem] w-80">
					<DropdownMenu.Label>Notifications</DropdownMenu.Label>
					<DropdownMenu.Separator />
					{#each notifications.items as item (item.id)}
						<DropdownMenu.Item
							class={cn(
								'flex-col items-start gap-1 text-sm font-normal tracking-normal normal-case',
								highlighted.has(item.id) && 'bg-primary/5'
							)}
						>
							{#snippet child({ props })}
								<a {...props} href="{resolve('/my-reports')}#{item.reference}">
									<span class="flex w-full items-start gap-2">
										<span class="min-w-0 flex-1">
											{#if item.kind === 'comment'}
												New update on <strong>{item.reference}</strong>
											{:else if item.kind === 'rejected'}
												<strong>{item.reference}</strong> was rejected
											{:else}
												<strong>{item.reference}</strong> is now
												<strong style:color={item.color}>{item.statusLabel}</strong>
											{/if}
										</span>
										{#if highlighted.has(item.id)}
											<span class="mt-1.5 size-2 shrink-0 rounded-full bg-primary"></span>
										{/if}
									</span>
									{#if item.body}
										<span class="text-muted-foreground line-clamp-2 w-full italic">
											"{item.body}"
										</span>
									{/if}
									<span class="text-muted-foreground w-full truncate text-xs">
										{item.title} · {item.ago}
									</span>
								</a>
							{/snippet}
						</DropdownMenu.Item>
					{:else}
						<p class="text-muted-foreground px-3 py-6 text-center text-sm">
							No updates on your reports yet.
						</p>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}

		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				aria-label="Account menu"
			>
				<Avatar.Root class="size-9">
					<Avatar.Image src="" alt="" />
					<Avatar.Fallback>
						<HugeiconsIcon icon={UserIcon} strokeWidth={2} class="size-5" />
					</Avatar.Fallback>
				</Avatar.Root>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-48">
				<DropdownMenu.Label class="truncate">
					{page.data.user?.name ?? 'My account'}
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
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
