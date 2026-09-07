<script lang="ts">
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Card from '$lib/components/ui/card';
	import TopBar from '$lib/dashboard/top-bar.svelte';
	import Footer from '$lib/dashboard/footer.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowRight01Icon,
		ArrowLeft01Icon,
		ArrowDown01Icon,
		Tick02Icon,
		MapPinIcon,
		LocateFixedIcon,
		ImagePlusIcon,
		Image01Icon,
		LockIcon,
		SendIcon
	} from '@hugeicons/core-free-icons';

	const steps = [
		{ n: 1, label: 'Issue Details', short: 'Details' },
		{ n: 2, label: 'Location & Photos', short: 'Location' },
		{ n: 3, label: 'Review & Submit', short: 'Review' }
	] as const;

	const current = $derived(page.state.step ?? 1);

	function goToStep(step: number) {
		pushState('', { step });
	}

	const categories = [
		'Pothole / Road Damage',
		'Streetlight Outage',
		'Graffiti / Vandalism',
		'Illegal Dumping',
		'Damaged Signage',
		'Water / Drainage',
		'Other'
	];

	let category = $state('');
	let description = $state('');
	let address = $state('');
</script>

<svelte:head>
	<title>Submit Report - CivicScan</title>
</svelte:head>

<div class="bg-muted/30 flex min-h-screen flex-col">
	<div class="bg-background border-b">
		<TopBar />
	</div>

	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-10">
		<h1 class="font-heading text-primary text-4xl font-extrabold tracking-tight">
			Report a Concern
		</h1>
		<p class="text-muted-foreground mt-2">
			Help us keep our community safe and clean. Your reports are routed directly to municipal
			staff.
		</p>

		<!-- Mobile stepper -->
		<div class="mt-8 flex items-center lg:hidden">
			{#each steps as step, i (step.n)}
				<div class="flex flex-col items-center gap-2">
					<div
						class="flex size-9 items-center justify-center rounded-full text-sm font-semibold {step.n <=
						current
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-muted-foreground border'}"
					>
						{#if step.n < current}
							<HugeiconsIcon icon={Tick02Icon} strokeWidth={2} class="size-4" />
						{:else}
							{step.n}
						{/if}
					</div>
					<span
						class="text-xs font-medium {step.n <= current
							? 'text-foreground'
							: 'text-muted-foreground'}"
					>
						{step.short}
					</span>
				</div>
				{#if i < steps.length - 1}
					<div class="mb-6 h-px flex-1 {step.n < current ? 'bg-primary' : 'bg-border'}"></div>
				{/if}
			{/each}
		</div>

		<div class="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
			<!-- Desktop step sidebar -->
			<aside class="hidden lg:block">
				<ol class="flex flex-col gap-8">
					{#each steps as step (step.n)}
						<li class="flex items-start gap-4">
							<div
								class="flex size-10 shrink-0 items-center justify-center text-sm font-semibold {step.n <=
								current
									? 'bg-primary text-primary-foreground'
									: 'bg-muted text-muted-foreground border'}"
							>
								{#if step.n < current}
									<HugeiconsIcon icon={Tick02Icon} strokeWidth={2} class="size-4" />
								{:else}
									{step.n}
								{/if}
							</div>
							<div class="pt-0.5">
								<p
									class="text-xs font-semibold tracking-wider uppercase {step.n <= current
										? 'text-primary'
										: 'text-muted-foreground'}"
								>
									Step {step.n}
								</p>
								<p
									class="font-medium {step.n <= current
										? 'text-foreground'
										: 'text-muted-foreground'}"
								>
									{step.label}
								</p>
							</div>
						</li>
					{/each}
				</ol>
			</aside>

			<!-- Step content -->
			<Card.Root class="px-6 py-6 md:px-8 md:py-8">
				{#if current === 1}
					<Card.Title class="normal-case tracking-normal">Describe the Issue</Card.Title>

					<div class="flex flex-col gap-6">
						<div class="flex flex-col gap-2">
							<label for="category" class="text-xs font-semibold tracking-wide uppercase">
								Issue Category
							</label>
							<div class="relative">
								<select
									id="category"
									bind:value={category}
									class="border-input bg-muted/40 focus-visible:border-ring focus-visible:ring-ring/30 h-11 w-full appearance-none border px-3 pr-10 text-sm outline-none focus-visible:ring-2 {category
										? 'text-foreground'
										: 'text-muted-foreground'}"
								>
									<option value="" disabled selected>Select a category...</option>
									{#each categories as c (c)}
										<option value={c} class="text-foreground">{c}</option>
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
							<label for="description" class="text-xs font-semibold tracking-wide uppercase">
								Description
							</label>
							<Textarea
								id="description"
								bind:value={description}
								placeholder="Please provide specific details about the issue..."
								class="min-h-32"
							/>
							<p class="text-muted-foreground text-xs">Min. 20 characters required.</p>
						</div>
					</div>

					<div class="flex justify-end">
						<Button onclick={() => goToStep(2)}>
							Next: Location & Photos
							<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
						</Button>
					</div>
				{:else if current === 2}
					<Card.Title class="normal-case tracking-normal">Where is it happening?</Card.Title>

					<div class="grid gap-6 md:grid-cols-2">
						<!-- Geolocation -->
						<div class="flex flex-col gap-2">
							<p class="text-xs font-semibold tracking-wide uppercase">Geolocation</p>
							<div
								class="bg-muted relative flex aspect-4/3 items-center justify-center overflow-hidden border"
							>
								<div
									class="absolute inset-0 opacity-40 [bg-[linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)]"
								></div>
								<HugeiconsIcon icon={MapPinIcon} strokeWidth={2} class="text-primary relative size-8" />
								<Button variant="outline" size="sm" class="bg-background absolute right-2 bottom-2">
									<HugeiconsIcon icon={LocateFixedIcon} strokeWidth={2} />
									Use My Location
								</Button>
							</div>
							<Input
								bind:value={address}
								placeholder="Enter address manually..."
								class="bg-muted/40 border px-3"
							/>
						</div>

						<!-- Photo upload -->
						<div class="flex flex-col gap-2">
							<p class="text-xs font-semibold tracking-wide uppercase">Photo Upload</p>
							<label
								class="bg-muted/40 hover:bg-muted flex aspect-4/3 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed text-center transition-colors"
							>
								<input type="file" accept="image/png,image/jpeg" multiple class="sr-only" />
								<HugeiconsIcon icon={ImagePlusIcon} strokeWidth={2} class="text-muted-foreground size-8" />
								<span class="text-sm font-semibold">Drag &amp; Drop or Browse</span>
								<span class="text-muted-foreground text-xs">Max size 10MB. Formats: JPG, PNG</span>
							</label>
							<div class="grid grid-cols-4 gap-2">
								{#each [0, 1] as slot (slot)}
									<div class="bg-muted flex aspect-square items-center justify-center border">
										<HugeiconsIcon icon={Image01Icon} strokeWidth={2} class="text-muted-foreground size-5" />
									</div>
								{/each}
							</div>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<Button variant="outline" onclick={() => goToStep(1)}>
							<HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
							Previous
						</Button>
						<Button onclick={() => goToStep(3)}>
							Next: Review Report
							<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
						</Button>
					</div>
				{:else}
					<Card.Title class="normal-case tracking-normal">Review Your Report</Card.Title>

					<div class="bg-muted/40 flex flex-col gap-6 border p-6">
						<div class="grid gap-6 sm:grid-cols-2">
							<div>
								<p class="text-primary text-xs font-semibold tracking-wide uppercase">
									Issue Summary
								</p>
								<p class="mt-2 font-semibold">
									{category || 'Pothole on Main St'}
								</p>
								<p class="text-muted-foreground mt-1 text-sm">
									{description ||
										'There is a deep pothole near the intersection that is causing cars to swerve dangerously into oncoming traffic.'}
								</p>
							</div>
							<div>
								<p class="text-primary text-xs font-semibold tracking-wide uppercase">Location</p>
								<p class="mt-2 flex items-center gap-1.5 text-sm">
									<HugeiconsIcon icon={MapPinIcon} strokeWidth={2} class="text-muted-foreground size-4 shrink-0" />
									{address || '123 City Center Ave, Downtown'}
								</p>
							</div>
						</div>

						<div class="border-t"></div>

						<div class="bg-background flex items-center gap-4 border p-4">
							<div
								class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center"
							>
								<HugeiconsIcon icon={LockIcon} strokeWidth={2} class="size-5" />
							</div>
							<div>
								<p class="text-sm font-semibold">Privacy Policy Information</p>
								<p class="text-muted-foreground text-xs">
									Your personal data is encrypted and used only for communication regarding this
									report.
								</p>
							</div>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<Button variant="outline" onclick={() => goToStep(2)}>
							<HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
							Previous
						</Button>
						<Button>
							<HugeiconsIcon icon={SendIcon} strokeWidth={2} />
							Submit Final Report
						</Button>
					</div>
				{/if}
			</Card.Root>
		</div>
	</main>

	<footer class="bg-muted/60 border-t py-8">
		<Footer />
	</footer>
</div>
