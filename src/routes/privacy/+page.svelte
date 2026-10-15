<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card';
	import TopBar from '$lib/dashboard/top-bar.svelte';
	import Footer from '$lib/dashboard/footer.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowLeft02Icon,
		CheckmarkCircle02Icon,
		Delete02Icon,
		Download04Icon,
		LeftToRightListBulletIcon,
		PencilEdit02Icon
	} from '@hugeicons/core-free-icons';

	const sections = [
		{ id: 'information-collected', title: 'Information Collected' },
		{ id: 'data-use', title: 'How CivicScan Uses Incident Data' },
		{ id: 'public-visibility', title: 'Anonymity & Public Visibility' },
		{ id: 'data-retention', title: 'Data Retention' },
		{ id: 'your-rights', title: 'Your Rights & Data Requests' },
		{ id: 'contact', title: 'Contact Data Protection' }
	];

	const collected = [
		{
			label: 'Incident Details',
			text: 'Category of defect (e.g., pothole, streetlight, graffiti), textual descriptions, and titles provided by you.'
		},
		{
			label: 'Photographic Evidence',
			text: 'User-uploaded images of urban damage attached to your report.'
		},
		{
			label: 'Geolocation Data',
			text: 'Pinpoint coordinates (latitude/longitude) and nearby street addresses to guide field municipal crews.'
		},
		{
			label: 'Account Credentials',
			text: 'Your name and verified email address, used to sign in and to manage your submitted reports.'
		}
	];

	const uses = [
		{
			title: 'Municipal Crew Dispatch',
			text: 'Directing public works departments, road maintenance, and utility providers to the physical repair location.'
		},
		{
			title: 'Status Notifications',
			text: 'Keeping you informed about report verification, crew scheduling, and task completion.'
		}
	];

	const rights = [
		{
			icon: Download04Icon,
			label: 'Access & Portability',
			text: 'Request a copy of every report and photo you have submitted, in a structured, machine-readable format.'
		},
		{
			icon: PencilEdit02Icon,
			label: 'Rectification',
			text: 'Correct the details of your reports at any time from My Reports.'
		},
		{
			icon: Delete02Icon,
			label: 'Erasure',
			text: 'Delete your account at any time from Account Settings. Reports staff have not yet reviewed are deleted along with their photos; reports already being handled remain part of the public works record but are permanently detached from your identity.'
		}
	];
</script>

<svelte:head>
	<title>Privacy Policy - CivicScan</title>
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
					Privacy Policy
				</h1>
				<p class="text-muted-foreground text-base">
					A straightforward summary of what data we collect, how it is used, and your rights as a
					citizen engaging with public municipal infrastructure.
				</p>

				<nav aria-labelledby="toc-heading" class="bg-muted/40 mt-5 border p-5">
					<h2 id="toc-heading" class="text-primary flex items-center gap-2 text-sm font-semibold">
						<HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} class="size-4" />
						Document Summary & Contents
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
						When you interact with the CivicScan platform to report municipal challenges, we collect
						only the information required to verify, prioritize, and dispatch repair teams
						effectively:
					</p>
					<ul class="flex flex-col gap-3">
						{#each collected as item (item.label)}
							<li class="flex gap-3">
								<HugeiconsIcon
									icon={CheckmarkCircle02Icon}
									strokeWidth={2}
									class="text-primary mt-0.5 size-5 shrink-0"
								/>
								<p>
									<span class="text-foreground font-semibold">{item.label}:</span>
									{item.text}
								</p>
							</li>
						{/each}
					</ul>
				</section>

				<section id={sections[1].id} aria-labelledby="{sections[1].id}-heading">
					{@render heading(1)}
					<p>
						All gathered data is applied strictly toward public benefit and governance efficiency.
						CivicScan never monetizes, resells, or leverages personal civic data for targeted
						commercial marketing:
					</p>
					<div class="grid gap-3 sm:grid-cols-2">
						{#each uses as use (use.title)}
							<div class="bg-muted/40 border p-4 text-sm">
								<h3 class="text-primary font-semibold">{use.title}</h3>
								<p class="mt-1">{use.text}</p>
							</div>
						{/each}
					</div>
				</section>

				<section id={sections[2].id} aria-labelledby="{sections[2].id}-heading">
					{@render heading(2)}
					<p>
						Democratic engagement requires trust. Citizens retain control over how their identity is
						displayed across public dashboards and civic maps:
					</p>
					<div class="border-primary bg-primary/5 text-foreground border-l-4 px-4 py-3 text-sm">
						<span class="font-semibold">Public Feed Guarantee:</span>
						Reports shown on the Public Issues feed and map display only the issue itself: its title,
						description, category, location, photos, and status. Your name and email address remain confidential
						within the secure operational database and are never displayed publicly.
					</div>
				</section>

				<section id={sections[3].id} aria-labelledby="{sections[3].id}-heading">
					{@render heading(3)}
					<p>
						Incident reports and associated photographic records are retained for a standard
						municipal period of <strong class="text-foreground">24 months</strong> from the date of final
						resolution. This ensures regulatory compliance, financial auditability of public expenditures,
						and historical infrastructure analysis. Upon conclusion of the 24-month cycle, records are
						fully anonymized into aggregated civic statistics.
					</p>
				</section>

				<section id={sections[4].id} aria-labelledby="{sections[4].id}-heading">
					{@render heading(4)}
					<p>
						Under the EU General Data Protection Regulation (GDPR) and applicable national data
						protection law, you maintain full control over your personal records:
					</p>
					<ul class="flex flex-col gap-3">
						{#each rights as right (right.label)}
							<li class="flex gap-3">
								<HugeiconsIcon
									icon={right.icon}
									strokeWidth={2}
									class="text-primary mt-0.5 size-5 shrink-0"
								/>
								<p>
									<span class="text-foreground font-semibold">{right.label}:</span>
									{right.text}
								</p>
							</li>
						{/each}
					</ul>
				</section>

				<section id={sections[5].id} aria-labelledby="{sections[5].id}-heading">
					{@render heading(5)}
					<p>
						Questions about this policy, or requests to exercise any of the rights above, can be
						directed to the municipality's Data Protection Officer through the Contact Us page or in
						person at city hall. We aim to respond to every request within one month.
					</p>
					<p>
						If you believe your data has been handled unlawfully, you also have the right to lodge a
						complaint with the Hellenic Data Protection Authority.
					</p>
				</section>
			</div>
		</Card.Root>
	</main>

	<footer class="bg-muted/60 border-t py-8">
		<Footer />
	</footer>
</div>
