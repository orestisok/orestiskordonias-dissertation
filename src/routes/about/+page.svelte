<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card';
	import TopBar from '$lib/dashboard/top-bar.svelte';
	import Footer from '$lib/dashboard/footer.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';

	const pillars = [
		{
			title: 'Citizen-Led Reporting',
			text: 'Photo evidence and map-pinned locations for municipal issues, straight from your phone.'
		},
		{
			title: 'Transparent Public Operations',
			text: 'Every report’s status and update history is visible on the Public Issues feed.'
		},
		{
			title: 'Faster Incident Dispatch',
			text: 'Categorized reports reach the right roads, sanitation, parks, or water teams directly.'
		},
		{
			title: 'Data Privacy & Integrity',
			text: 'Reporter identities stay private, and civic data is never used commercially.'
		}
	];

	const sections = [
		{ id: 'mission', title: 'Our Mission' },
		{ id: 'how-it-works', title: 'How It Works' },
		{ id: 'governance', title: 'Open Governance & Accountability' }
	];

	const steps = [
		{
			title: 'Report with Photo & Location',
			text: 'Snap photos on site, pin the exact spot on the map, and pick a category so nothing is ambiguous.',
			stage: 'Citizen Entry'
		},
		{
			title: 'Municipal Triage',
			text: 'City staff acknowledge each report, check it against existing issues, and assign a field crew.',
			stage: 'Operations'
		},
		{
			title: 'Real-Time Tracking',
			text: 'Follow your report from submitted to resolved, with dated updates from the crews on the ground.',
			stage: 'Resolution'
		}
	];
</script>

<svelte:head>
	<title>About CivicScan - CivicScan</title>
</svelte:head>

{#snippet heading(index: number)}
	<h2
		id="{sections[index].id}-heading"
		class="font-heading text-foreground flex items-baseline gap-2 text-lg font-semibold tracking-tight md:text-xl"
	>
		<span class="text-primary font-bold">{String(index + 1).padStart(2, '0')}.</span>
		{sections[index].title}
	</h2>
{/snippet}

<div class="bg-muted/30 flex min-h-screen flex-col">
	<div class="bg-background border-b">
		<TopBar />
	</div>

	<main class="mx-auto w-full max-w-3xl flex-1 px-4 py-8 md:px-6 md:py-10">
		<a
			href={resolve('/my-reports')}
			class="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
		>
			<HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} class="size-4" />
			Back to Citizen Portal
		</a>

		<Card.Root class="mt-4 gap-0 py-0">
			<header class="flex flex-col gap-3 border-b px-6 py-8 md:px-10">
				<h1 class="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">
					About CivicScan
				</h1>
				<p class="text-muted-foreground text-base">
					Empowering citizens and municipal teams to build safer, cleaner, and more resilient
					communities together through transparent civic technology.
				</p>

				<div class="bg-muted/40 mt-5 border p-5">
					<h2
						id="pillars-heading"
						class="text-primary text-xs font-semibold tracking-wide uppercase"
					>
						Foundational Program Pillars
					</h2>
					<ol aria-labelledby="pillars-heading" class="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
						{#each pillars as pillar, i (pillar.title)}
							<li class="flex gap-3">
								<span
									class="bg-primary text-primary-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
								>
									{i + 1}
								</span>
								<div>
									<h3 class="text-sm font-semibold">{pillar.title}</h3>
									<p class="text-muted-foreground mt-0.5 text-sm">{pillar.text}</p>
								</div>
							</li>
						{/each}
					</ol>
				</div>
			</header>

			<div
				class="text-muted-foreground flex flex-col divide-y px-6 leading-relaxed md:px-10 [&>section]:flex [&>section]:flex-col [&>section]:gap-3 [&>section]:py-8"
			>
				<section id={sections[0].id} aria-labelledby="{sections[0].id}-heading">
					{@render heading(0)}
					<p>
						CivicScan was commissioned to bridge the historic gap between community residents and
						municipal public works departments. Local maintenance challenges, such as damaged
						pavement, faulty streetlights, localized flooding, and fly-tipping, have traditionally
						relied on fractured reporting channels, leading to delayed repairs and citizen
						frustration.
					</p>
					<p>
						By establishing a shared, real-time operating framework, CivicScan turns local residents
						from passive observers into active civic partners. Every report feeds directly into
						municipal work queues, cutting bureaucracy and establishing open accountability for
						neighbourhood wellbeing.
					</p>
				</section>

				<section id={sections[1].id} aria-labelledby="{sections[1].id}-heading">
					{@render heading(1)}
					<p>The platform simplifies the municipal repair lifecycle into three stages:</p>
					<ol class="grid gap-3 sm:grid-cols-3">
						{#each steps as step, i (step.title)}
							<li class="bg-muted/40 flex flex-col border p-4 text-sm">
								<h3 class="text-foreground font-semibold">{i + 1}. {step.title}</h3>
								<p class="mt-1 flex-1">{step.text}</p>
								<p class="text-primary mt-4 border-t pt-3 text-xs font-medium">
									Step {i + 1} · {step.stage}
								</p>
							</li>
						{/each}
					</ol>
				</section>

				<section id={sections[2].id} aria-labelledby="{sections[2].id}-heading">
					{@render heading(2)}
					<p>
						Democratic transparency is at the core of our technical architecture. Every report keeps
						a dated public history of status changes and staff updates, and the Public Issues feed
						lets any resident follow the work happening in their neighbourhood without exposing who
						reported it.
					</p>
					<blockquote
						class="border-primary bg-muted/40 text-foreground border-l-4 px-4 py-3 text-sm italic"
					>
						“Every report filed through CivicScan is bound by public service performance standards.
						Open status tracking ensures response times are visible to neighbourhood councils and
						independent civic observers.”
					</blockquote>
				</section>
			</div>
		</Card.Root>
	</main>

	<footer class="bg-muted/60 border-t py-8">
		<Footer />
	</footer>
</div>
