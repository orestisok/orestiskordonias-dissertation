<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import TopBar from '$lib/dashboard/top-bar.svelte';
	import Footer from '$lib/dashboard/footer.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { ArrowLeft02Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';

	const details = [
		{
			label: 'Primary Telephone',
			value: '(2310) 019-4820'
		},
		{
			label: 'Hours of Operation',
			value: 'Mon–Fri, 8 AM – 5 PM'
		},
		{
			label: 'Response Turnaround',
			value: 'Within 1 Business Day'
		}
	];

	let name = $state('');
	let email = $state('');
	let subject = $state('');
	let message = $state('');

	let attempted = $state(false);
	let sent = $state(false);

	const errors = $derived({
		name: attempted && !name.trim() ? 'Please enter your full name.' : '',
		email:
			attempted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
				? 'Please enter a valid email address.'
				: '',
		subject: attempted && !subject.trim() ? 'Please add a short subject line.' : '',
		message: attempted && !message.trim() ? 'Please describe your inquiry.' : ''
	});

	function submit(event: SubmitEvent) {
		event.preventDefault();
		attempted = true;
		if (Object.values(errors).some(Boolean)) return;
		sent = true;
	}

	function reset() {
		name = email = subject = message = '';
		attempted = false;
		sent = false;
	}
</script>

<svelte:head>
	<title>Contact Us - CivicScan</title>
</svelte:head>

{#snippet heading(id: string, step: number, title: string)}
	<h2
		{id}
		class="font-heading text-foreground flex items-center gap-3 text-lg font-semibold tracking-tight md:text-xl"
	>
		<span
			class="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
		>
			{step}
		</span>
		{title}
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
				<h1 class="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">Contact Us</h1>
				<p class="text-muted-foreground text-base">
					Get in touch with municipal departments, public works teams, or technical support for
					CivicScan. We are committed to transparency, rapid civic response, and accessible local
					government.
				</p>
			</header>

			<div
				class="text-muted-foreground flex flex-col divide-y px-6 leading-relaxed md:px-10 [&>section]:flex [&>section]:flex-col [&>section]:gap-3 [&>section]:py-8"
			>
				<section aria-labelledby="inquiries-heading">
					{@render heading('inquiries-heading', 1, 'General Citizen Inquiries')}
					<p>
						For common questions concerning municipal services, neighbourhood programs, or
						assistance navigating CivicScan, citizen representatives are available during standard
						operating hours.
					</p>
					<dl class="bg-muted/40 grid gap-3 border p-3 sm:grid-cols-3">
						{#each details as detail (detail.label)}
							<div class="bg-background flex flex-col gap-0.5 border p-4 text-sm">
								<dt class="text-primary text-xs font-semibold">{detail.label}</dt>
								<dd class="text-foreground font-semibold">{detail.value}</dd>
							</div>
						{/each}
					</dl>
				</section>

				<section aria-labelledby="message-heading">
					{@render heading('message-heading', 2, 'Send a Direct Message')}
					<p>
						Use this form to send non-emergency questions straight to municipal administrative
						staff. For issues that need fixing, please use Submit Report instead so crews can track
						them.
					</p>

					<div class="bg-muted/40 border p-5 md:p-6">
						{#if sent}
							<div role="status" class="flex flex-col items-center gap-3 py-6 text-center">
								<HugeiconsIcon
									icon={CheckmarkCircle02Icon}
									strokeWidth={2}
									class="text-primary size-12"
								/>
								<h3 class="font-heading text-foreground text-lg font-semibold">Message received</h3>
								<p class="max-w-md text-sm">
									Thank you, {name.trim()}. Your message “{subject.trim()}” has been received and a
									citizen representative will follow up at
									<span class="text-foreground font-medium">{email.trim()}</span>
									within one business day.
								</p>
								<Button variant="outline" class="mt-2" onclick={reset}>Send another message</Button>
							</div>
						{:else}
							<form novalidate onsubmit={submit} class="flex flex-col gap-5">
								<div class="grid gap-5 sm:grid-cols-2">
									<div class="flex flex-col gap-2">
										<label for="name" class="text-foreground text-xs font-semibold">
											Full Name <span class="text-destructive">*</span>
										</label>
										<Input
											id="name"
											bind:value={name}
											autocomplete="name"
											placeholder="e.g., Mpampis Alexiou"
											aria-invalid={!!errors.name}
											aria-describedby={errors.name ? 'name-error' : undefined}
											class="bg-background border-input focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive h-11 border px-3 focus-visible:ring-2"
										/>
										{#if errors.name}
											<p id="name-error" class="text-destructive text-xs" role="alert">
												{errors.name}
											</p>
										{/if}
									</div>

									<div class="flex flex-col gap-2">
										<label for="email" class="text-foreground text-xs font-semibold">
											Email Address <span class="text-destructive">*</span>
										</label>
										<Input
											id="email"
											type="email"
											bind:value={email}
											autocomplete="email"
											placeholder="e.g., mpampis.alexiou@example.com"
											aria-invalid={!!errors.email}
											aria-describedby={errors.email ? 'email-error' : undefined}
											class="bg-background border-input focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive h-11 border px-3 focus-visible:ring-2"
										/>
										{#if errors.email}
											<p id="email-error" class="text-destructive text-xs" role="alert">
												{errors.email}
											</p>
										{/if}
									</div>
								</div>

								<div class="flex flex-col gap-2 sm:w-1/2 sm:pr-2.5">
									<label for="subject" class="text-foreground text-xs font-semibold">
										Subject Line <span class="text-destructive">*</span>
									</label>
									<Input
										id="subject"
										bind:value={subject}
										placeholder="Brief summary of inquiry"
										aria-invalid={!!errors.subject}
										aria-describedby={errors.subject ? 'subject-error' : undefined}
										class="bg-background border-input focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive h-11 border px-3 focus-visible:ring-2"
									/>
									{#if errors.subject}
										<p id="subject-error" class="text-destructive text-xs" role="alert">
											{errors.subject}
										</p>
									{/if}
								</div>

								<div class="flex flex-col gap-2">
									<label for="message" class="text-foreground text-xs font-semibold">
										Message Details <span class="text-destructive">*</span>
									</label>
									<Textarea
										id="message"
										bind:value={message}
										placeholder="Provide precise details, incident location, or report numbers if applicable..."
										aria-invalid={!!errors.message}
										aria-describedby={errors.message ? 'message-error' : undefined}
										class="bg-background min-h-28"
									/>
									{#if errors.message}
										<p id="message-error" class="text-destructive text-xs" role="alert">
											{errors.message}
										</p>
									{/if}
								</div>

								<Button type="submit" class="self-start">Submit Message</Button>
							</form>
						{/if}
					</div>
				</section>
			</div>
		</Card.Root>
	</main>

	<footer class="bg-muted/60 border-t py-8">
		<Footer />
	</footer>
</div>
