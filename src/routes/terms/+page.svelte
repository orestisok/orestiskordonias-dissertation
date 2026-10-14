<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card';
	import TopBar from '$lib/dashboard/top-bar.svelte';
	import Footer from '$lib/dashboard/footer.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowLeft02Icon,
		LeftToRightListBulletIcon,
		SirenIcon
	} from '@hugeicons/core-free-icons';

	const sections = [
		{ id: 'acceptance', title: 'Acceptance of Terms' },
		{ id: 'reporting-integrity', title: 'Reporting Integrity & Prohibited Content' },
		{ id: 'media-rights', title: 'Submissions & Media Rights' },
		{ id: 'response-times', title: 'Response Times & Dispatches' },
		{ id: 'account-security', title: 'Account Security' },
		{ id: 'liability', title: 'Limitation of Liability & Disclaimers' }
	];
</script>

<svelte:head>
	<title>Terms of Service - CivicScan</title>
</svelte:head>

{#snippet heading(index: number)}
	<h2
		id="{sections[index].id}-heading"
		class="font-heading text-foreground flex items-baseline gap-2 text-lg font-semibold tracking-tight md:text-xl"
	>
		<span class="text-primary text-base font-bold">{index + 1}.</span>
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
					Terms of Service
				</h1>
				<p class="text-muted-foreground text-base">
					Rules and guidelines for municipal engagement, issue reporting, and use of digital city
					services through CivicScan.
				</p>

				<nav aria-labelledby="toc-heading" class="bg-muted/40 mt-5 border p-5">
					<h2 id="toc-heading" class="text-primary flex items-center gap-2 text-sm font-semibold">
						<HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} class="size-4" />
						Document Overview & Table of Contents
					</h2>
					<ol class="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
						{#each sections as section, i (section.id)}
							<li class="flex gap-1.5">
								<span class="text-primary font-semibold">{i + 1}.</span>
								<a
									href="#{section.id}"
									class="text-muted-foreground hover:text-primary transition-colors hover:underline"
								>
									{section.title}
								</a>
							</li>
						{/each}
					</ol>
				</nav>
			</header>

			<div
				class="text-muted-foreground flex flex-col divide-y px-6 leading-relaxed md:px-10 [&>section]:flex [&>section]:scroll-mt-6 [&>section]:flex-col [&>section]:gap-3 [&>section]:py-8"
			>
				<section id={sections[0].id} aria-labelledby="{sections[0].id}-heading">
					{@render heading(0)}
					<p>
						By accessing, browsing, or submitting reports through CivicScan, citizens, residents,
						and visitors agree to adhere strictly to municipal governance guidelines and the
						acceptable use standards established by the city administration.
					</p>
					<p>
						These terms form a binding standard between user engagements and the municipal
						administrative board. If you do not agree with any provision of these terms, please
						refrain from using authenticated reporting tools and instead direct inquiries via
						standard postal or in-person city hall channels.
					</p>
				</section>

				<section id={sections[1].id} aria-labelledby="{sections[1].id}-heading">
					{@render heading(1)}
					<p>
						Reports must reflect truthful, real-world conditions observed within municipal
						boundaries. To ensure that municipal dispatch crews can prioritize vital community
						repairs, all submissions undergo automated geovalidation and triage checks.
					</p>
					<div class="border-destructive bg-destructive/5 border-l-4 px-4 py-3 text-sm">
						<span class="text-destructive font-semibold">Strict Prohibition:</span>
						Submitting falsified reports, spamming dispatch queues, uploading defamatory statements, or
						transmitting non-incident commercial advertisements is unlawful and will lead to immediate
						account suspension and potential statutory penalties under the municipal civic code.
					</div>
				</section>

				<section id={sections[2].id} aria-labelledby="{sections[2].id}-heading">
					{@render heading(2)}
					<p>
						Photos, descriptions, geographic coordinates, and notes submitted through CivicScan
						become part of public municipal works records used for dispatch verification, contractor
						tasking, and infrastructure tracking.
					</p>
					<p>
						While media submissions are archived in public work order tracking, personal
						identifiable information (PII) including citizen identities, contact phone numbers, and
						private residential metadata is preserved under strict privacy protections and redacted
						from open-data portals.
					</p>
				</section>

				<section id={sections[3].id} aria-labelledby="{sections[3].id}-heading">
					{@render heading(3)}
					<p>
						While municipal crews strive to acknowledge all public civic reports within 48 business
						hours, scheduling and repair completions vary based on seasonal demands, crew
						availability, and weather conditions.
					</p>
					<div
						role="note"
						class="border-primary/40 bg-primary/5 text-foreground flex gap-3 border px-4 py-3 text-sm"
					>
						<HugeiconsIcon
							icon={SirenIcon}
							strokeWidth={2}
							class="text-primary mt-0.5 size-5 shrink-0"
						/>
						<p>
							<span class="font-semibold">Emergency Services Notice:</span>
							CivicScan is not an emergency response dispatch system. Life-threatening emergencies, immediate
							safety hazards, gas leaks, sparking downed wires, or active criminal incidents must be reported
							immediately via <strong>112</strong> or direct emergency dispatch lines.
						</p>
					</div>
				</section>

				<section id={sections[4].id} aria-labelledby="{sections[4].id}-heading">
					{@render heading(4)}
					<p>
						Users maintaining authenticated resident accounts are responsible for safeguarding their
						login credentials and authentication tokens. Any action recorded under an authenticated
						civic profile is presumed to be submitted by the authorized account holder.
					</p>
					<p>
						Notify the city digital safety unit immediately if you suspect unauthorized access or
						compromise of your civic profile credentials.
					</p>
				</section>

				<section id={sections[5].id} aria-labelledby="{sections[5].id}-heading">
					{@render heading(5)}
					<p>
						CivicScan is provided on an "as is" and "as available" basis. The municipality makes no
						guarantee that the service will be uninterrupted, error-free, or that every submitted
						report will result in a specific repair or outcome.
					</p>
					<p>
						To the fullest extent permitted by law, the municipality is not liable for indirect or
						consequential losses arising from the use of, or inability to use, CivicScan, including
						delays in acknowledging or resolving reported issues.
					</p>
				</section>
			</div>
		</Card.Root>
	</main>

	<footer class="bg-muted/60 border-t py-8">
		<Footer />
	</footer>
</div>
