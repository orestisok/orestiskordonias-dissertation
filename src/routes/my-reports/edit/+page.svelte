<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Card from '$lib/components/ui/card';
	import TopBar from '$lib/dashboard/top-bar.svelte';
	import Footer from '$lib/dashboard/footer.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowRight01Icon,
		ArrowDown01Icon,
		MapPinIcon,
		Location01Icon,
		Image01Icon,
		Camera01Icon,
		Tick02Icon,
		RefreshIcon
	} from '@hugeicons/core-free-icons';

	const categories = [
		'Pothole / Road Damage',
		'Streetlight Outage',
		'Graffiti',
		'Illegal Dumping',
		'Damaged Signage',
		'Water / Drainage',
		'Other'
	];

	// static wireframe values (for now)
	let category = $state('Graffiti');
	let description = $state(
		"Large graffiti tag on the side of the utility box near the bus stop. It's been there for a few days and is spreading onto the adjacent fence."
	);
	let address = $state('452 Elm Street, near Main St');

	function saveChanges() {
		goto(resolve('/my-reports'));
	}
</script>

<svelte:head>
	<title>Edit Report - CivicScan</title>
</svelte:head>

<div class="bg-muted/30 flex min-h-screen flex-col">
	<div class="bg-background border-b">
		<TopBar />
	</div>

	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-10">
		<!-- Breadcrumb -->
		<nav class="text-muted-foreground flex items-center gap-1.5 text-sm">
			<a href={resolve('/my-reports')} class="hover:text-foreground transition-colors">My Reports</a
			>
			<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} class="size-4" />
			<span class="text-foreground font-medium">Edit Report #CT-8892</span>
		</nav>

		<!-- Header -->
		<div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h1 class="font-heading text-4xl font-extrabold tracking-tight">Edit Report</h1>
				<p class="text-muted-foreground mt-2">
					Update the details of your submitted report. Changes will be reviewed by city staff.
				</p>
			</div>
			<span
				class="bg-primary/10 text-primary flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wide uppercase"
			>
				<HugeiconsIcon icon={RefreshIcon} strokeWidth={2} class="size-4" />
				In Progress
			</span>
		</div>

		<div class="mt-8 grid gap-6 xl:grid-cols-2">
			<!-- Left column -->
			<div class="flex flex-col gap-6">
				<!-- Issue Details -->
				<Card.Root class="px-6 py-6 md:px-8 md:py-8">
					<Card.Title class="normal-case tracking-normal">Issue Details</Card.Title>

					<div class="grid gap-6 md:grid-cols-2">
						<div class="flex flex-col gap-2">
							<label for="category" class="text-xs font-semibold tracking-wide uppercase">
								Category
							</label>
							<div class="relative">
								<select
									id="category"
									bind:value={category}
									class="border-input bg-muted/40 focus-visible:border-ring focus-visible:ring-ring/30 h-11 w-full appearance-none border px-3 pr-10 text-sm text-foreground outline-none focus-visible:ring-2"
								>
									{#each categories as c (c)}
										<option value={c}>{c}</option>
									{/each}
								</select>
								<HugeiconsIcon
									icon={ArrowDown01Icon}
									strokeWidth={2}
									class="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
								/>
							</div>
						</div>

						<div class="flex flex-col gap-2">
							<label for="report-id" class="text-xs font-semibold tracking-wide uppercase">
								Report ID
							</label>
							<Input
								id="report-id"
								value="CT-8892 · AB-455190"
								readonly
								class="bg-muted/60 text-muted-foreground border px-3"
							/>
						</div>
					</div>

					<div class="flex flex-col gap-2">
						<label for="description" class="text-xs font-semibold tracking-wide uppercase">
							Description
						</label>
						<Textarea id="description" bind:value={description} class="min-h-32" />
						<p class="text-muted-foreground text-xs">
							Please provide specific details to help staff locate and resolve the issue.
						</p>
					</div>
				</Card.Root>

				<!-- Photos -->
				<Card.Root class="px-6 py-6 md:px-8 md:py-8">
					<div class="flex items-center justify-between">
						<Card.Title class="normal-case tracking-normal">Photos</Card.Title>
						<span class="text-muted-foreground text-sm">2 / 5 uploaded</span>
					</div>

					<div class="flex flex-wrap gap-4">
						{#each [0, 1] as slot (slot)}
							<div class="bg-muted flex size-32 items-center justify-center border">
								<HugeiconsIcon
									icon={Image01Icon}
									strokeWidth={2}
									class="text-muted-foreground size-6"
								/>
							</div>
						{/each}
						<label
							class="bg-muted/40 hover:bg-muted text-primary flex size-32 cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed text-center transition-colors"
						>
							<input type="file" accept="image/png,image/jpeg" multiple class="sr-only" />
							<HugeiconsIcon icon={Camera01Icon} strokeWidth={2} class="size-6" />
							<span class="text-xs font-semibold">Add photo</span>
						</label>
					</div>
				</Card.Root>
			</div>

			<!-- Right column -->
			<div class="flex flex-col gap-6">
				<!-- Location -->
				<Card.Root class="px-6 py-6 md:px-8 md:py-8">
					<Card.Title class="normal-case tracking-normal">Location</Card.Title>

					<div
						class="bg-muted relative flex aspect-video items-center justify-center overflow-hidden border"
					>
						<div
							class="absolute inset-0 opacity-40 [bg-[linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)]"
						></div>
						<HugeiconsIcon icon={MapPinIcon} strokeWidth={2} class="relative size-8 text-red-500" />
					</div>

					<div class="flex flex-col gap-2">
						<label for="address" class="text-xs font-semibold tracking-wide uppercase">
							Street Address or Cross Street
						</label>
						<div class="relative">
							<HugeiconsIcon
								icon={Location01Icon}
								strokeWidth={2}
								class="text-primary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
							/>
							<Input id="address" bind:value={address} class="bg-muted/40 border pr-3 pl-9" />
						</div>
					</div>

					<Button variant="outline" class="w-full">
						<HugeiconsIcon icon={MapPinIcon} strokeWidth={2} />
						Adjust Pin on Map
					</Button>
				</Card.Root>

				<!-- Action Buttons -->
				<Card.Root class="px-5 py-5 md:px-8 md:py-8">
					<div class="flex flex-col gap-3 w-full sm:w-auto">
						<Button onclick={saveChanges}>
							<HugeiconsIcon icon={Tick02Icon} strokeWidth={1} />
							Save Changes
						</Button>
						<Button variant="outline" href="/my-reports" class="w-full sm:w-auto">Cancel</Button>
					</div>
				</Card.Root>
			</div>
		</div>
	</main>

	<footer class="bg-muted/60 border-t py-8">
		<Footer />
	</footer>
</div>
