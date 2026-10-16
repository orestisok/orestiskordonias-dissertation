import { page } from '$app/state';
import type { RouteId } from '$app/types';
import { ChartColumn, LayoutDashboard, ListTodo } from '@lucide/svelte';
import { isActive } from '$lib/dashboard/nav';

export const staffNav = [
	{ route: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
	{ route: '/dashboard/queue', label: 'Reports Queue', icon: ListTodo },
	{ route: '/dashboard/analytics', label: 'Analytics', icon: ChartColumn }
] as const satisfies { route: RouteId; label: string; icon: unknown }[];

export const isStaffActive = (route: RouteId) =>
	route === '/dashboard' ? page.route.id === route : isActive(route);

export const staffTitle = () =>
	staffNav.find((item) => isStaffActive(item.route))?.label ?? 'Dashboard';
