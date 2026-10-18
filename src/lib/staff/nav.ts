import { page } from '$app/state';
import type { RouteId } from '$app/types';
import { ChartColumn, LayoutDashboard, ListTodo, UserCog } from '@lucide/svelte';
import { isActive } from '$lib/dashboard/nav';

export const staffNav = [
	{ route: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
	{ route: '/dashboard/queue', label: 'Reports Queue', icon: ListTodo, adminOnly: false },
	{ route: '/dashboard/analytics', label: 'Analytics', icon: ChartColumn, adminOnly: false },
	{ route: '/dashboard/management', label: 'Management', icon: UserCog, adminOnly: true }
] as const satisfies { route: RouteId; label: string; icon: unknown; adminOnly: boolean }[];

export const visibleStaffNav = () =>
	staffNav.filter((item) => !item.adminOnly || page.data.user?.role === 'admin');

export const isStaffActive = (route: RouteId) =>
	route === '/dashboard' ? page.route.id === route : isActive(route);

export const staffTitle = () =>
	staffNav.find((item) => isStaffActive(item.route))?.label ?? 'Dashboard';
