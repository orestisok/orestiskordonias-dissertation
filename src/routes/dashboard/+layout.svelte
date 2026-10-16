<script lang="ts">
	import Sidebar from '$lib/staff/sidebar.svelte';
	import TopBar from '$lib/staff/top-bar.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-svh bg-muted/30">
	<Sidebar />
	<div class="flex min-w-0 flex-1 flex-col">
		<TopBar />
		{@render children()}
	</div>
</div>
