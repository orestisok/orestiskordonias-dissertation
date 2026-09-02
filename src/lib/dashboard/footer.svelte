<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<footer>
	<div class="flex flex-col items-start gap-2 lg:flex-row lg:items-center lg:justify-between">
		<!-- Left side: logo + all rights reserved declaration -->
		<div class="flex flex-col gap-2 px-4 md:px-6">
			<div class="text-lg font-semibold text-primary">CivicScan</div>
			<p>
				@2026 Municipality of Thessaloniki. <span class="block md:inline">All rights reserved</span>
			</p>
		</div>

		<!-- Right side: contact and other info -->
		<nav class="flex flex-col gap-6 px-4 md:flex-row md:gap-6 md:px-6">
			<a href={resolve('/')}> Contact Us </a>
			<a href={resolve('/')}> Privacy Policy </a>
			<a href={resolve('/')}> Terms of Service </a>
			<a href={resolve('/')}> Accessibility </a>
		</nav>
	</div>
</footer>
