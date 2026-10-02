<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<!-- Placeholder until the staff dashboard is built -->
<div class="flex min-h-svh items-center justify-center p-4">
	<div class="text-center">
		<h1 class="text-2xl font-semibold text-primary">Staff dashboard</h1>
		<p class="mt-2 text-muted-foreground">Welcome, {data.name}. This page is coming soon.</p>
	</div>
</div>
