<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { MAX_PHOTOS } from '$lib/photos';
	import { MAX_DESCRIPTION, MAX_TITLE, MIN_DESCRIPTION, statusMeta } from '$lib/reports';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Card from '$lib/components/ui/card';
	import LocationPicker from '$lib/components/location-picker.svelte';
	import TopBar from '$lib/dashboard/top-bar.svelte';
	import Footer from '$lib/dashboard/footer.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { ArrowLeft02Icon, ArrowDown01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const initial = untrack(() => data.report);

	let title = $state(initial.title);
	let categoryId = $state<number | ''>(initial.categoryId);
	let description = $state(initial.description);
	let lng = $state<number | null>(initial.lng);
	let lat = $state<number | null>(initial.lat);
	let address = $state(initial.address);

	let attempted = $state(false);
	let submitting = $state(false);

	const valid = $derived(
		title.trim() !== '' &&
			categoryId !== '' &&
			description.trim().length >= MIN_DESCRIPTION &&
			lng !== null &&
			lat !== null
	);
	const titleError = $derived(
		attempted && !title.trim() ? 'Please give the issue a short title.' : ''
	);
	const categoryError = $derived(
		attempted && categoryId === '' ? 'Please select an issue category.' : ''
	);
	const descriptionError = $derived(
		attempted && description.trim().length < MIN_DESCRIPTION
			? `Please provide a longer description (at least ${MIN_DESCRIPTION} characters).`
			: ''
	);
	const locationError = $derived(
		attempted && (lng === null || lat === null) ? 'Please choose a location on the map.' : ''
	);

	const status = $derived(statusMeta[data.report.status]);
</script>

<svelte:head>
	<title>Edit Report {data.report.reference} - CivicScan</title>
</svelte:head>

<div class="bg-muted/30 flex min-h-screen flex-col">
	<div class="bg-background border-b">
		<TopBar />
	</div>

	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6 md:py-10">
		<a
			href={resolve('/my-reports')}
			class="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
		>
			<HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} class="size-4" />
			Back to My Reports
		</a>

		<h1 class="font-heading mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
			Edit Report #{data.report.reference}
		</h1>
		<p class="text-muted-foreground mt-2">
			Update the details of your submitted report. Changes will be reviewed by city staff.
		</p>

		<div class="mt-8 grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
			<Card.Root class="gap-6 px-6 py-6 md:px-8">
				<div class="flex items-center justify-between gap-4 border-b pb-4">
					<Card.Title class="text-xl normal-case tracking-normal">Issue Details</Card.Title>
					<span class="px-2 py-0.5 text-xs font-semibold tracking-wide uppercase {status.badge}">
						{status.label}
					</span>
				</div>

				<div class="flex flex-col gap-2">
					<label for="title" class="text-xs font-semibold tracking-wide uppercase">
						Title <span class="text-destructive">*</span>
					</label>
					<Input
						id="title"
						bind:value={title}
						maxlength={MAX_TITLE}
						aria-invalid={!!titleError}
						aria-describedby={titleError ? 'title-error' : undefined}
						class="bg-muted/40 aria-invalid:border-destructive h-11 border px-3"
					/>
					{#if titleError}
						<p id="title-error" class="text-destructive text-xs" role="alert">{titleError}</p>
					{/if}
				</div>

				<div class="flex flex-col gap-2">
					<label for="category" class="text-xs font-semibold tracking-wide uppercase">
						Category <span class="text-destructive">*</span>
					</label>
					<div class="relative">
						<select
							id="category"
							bind:value={categoryId}
							aria-invalid={!!categoryError}
							aria-describedby={categoryError ? 'category-error' : undefined}
							class="border-input bg-muted/40 text-foreground focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive h-11 w-full appearance-none border px-3 pr-10 text-sm outline-none focus-visible:ring-2"
						>
							{#each data.categories as c (c.id)}
								<option value={c.id}>{c.name}</option>
							{/each}
						</select>
						<HugeiconsIcon
							icon={ArrowDown01Icon}
							strokeWidth={2}
							class="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
						/>
					</div>
					{#if categoryError}
						<p id="category-error" class="text-destructive text-xs" role="alert">
							{categoryError}
						</p>
					{/if}
				</div>

				<div class="flex flex-col gap-2">
					<label for="description" class="text-xs font-semibold tracking-wide uppercase">
						Description <span class="text-destructive">*</span>
					</label>
					<Textarea
						id="description"
						bind:value={description}
						maxlength={MAX_DESCRIPTION}
						aria-invalid={!!descriptionError}
						aria-describedby="description-hint"
						class="min-h-32"
					/>
					{#if descriptionError}
						<p id="description-hint" class="text-destructive text-xs" role="alert">
							{descriptionError}
						</p>
					{:else}
						<p id="description-hint" class="text-muted-foreground text-xs">
							Please provide specific details to help staff locate and resolve the issue.
						</p>
					{/if}
				</div>
			</Card.Root>

			<Card.Root class="gap-6 px-6 py-6 md:px-8 lg:col-start-2 lg:row-start-1">
				<div class="border-b pb-4">
					<Card.Title class="text-xl normal-case tracking-normal">Location</Card.Title>
				</div>
				<LocationPicker
					bind:lng
					bind:lat
					bind:address
					error={locationError}
					lockable
					mapClass="aspect-video"
				/>
			</Card.Root>

			<Card.Root class="gap-6 px-6 py-6 md:px-8 lg:col-start-1 lg:row-start-2">
				<div class="flex items-center justify-between gap-4 border-b pb-4">
					<Card.Title class="text-xl normal-case tracking-normal">Photos</Card.Title>
					<span class="bg-muted text-muted-foreground px-2 py-0.5 text-xs font-semibold">
						{data.report.photos.length} / {MAX_PHOTOS} uploaded
					</span>
				</div>
				{#if data.report.photos.length}
					<div class="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-4">
						{#each data.report.photos as url, i (url)}
							<img
								src={url}
								alt="Photo {i + 1} of the report"
								loading="lazy"
								class="aspect-square w-full border object-cover sm:size-32"
							/>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground text-sm">No photos were attached to this report.</p>
				{/if}
				<p class="text-muted-foreground text-xs">Photos can't be changed after submitting.</p>
			</Card.Root>

			<form
				method="POST"
				class="lg:bg-card lg:ring-foreground/5 flex flex-col gap-3 lg:col-start-2 lg:row-start-2 lg:p-8 lg:shadow-sm lg:ring-1"
				use:enhance={({ cancel }) => {
					attempted = true;
					if (!valid) {
						cancel();
						return;
					}
					submitting = true;
					return async ({ update }) => {
						await update({ reset: false });
						submitting = false;
					};
				}}
			>
				{#if form?.message}
					<p class="text-destructive text-sm" role="alert">{form.message}</p>
				{/if}

				<input type="hidden" name="title" value={title} />
				<input type="hidden" name="categoryId" value={categoryId} />
				<input type="hidden" name="description" value={description} />
				<input type="hidden" name="lng" value={lng ?? ''} />
				<input type="hidden" name="lat" value={lat ?? ''} />
				<input type="hidden" name="address" value={address} />

				<Button type="submit" class="w-full" disabled={submitting}>
					<HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
					{submitting ? 'Saving…' : 'Save Changes'}
				</Button>
				<Button variant="outline" href="/my-reports" class="w-full">Cancel</Button>
			</form>
		</div>
	</main>

	<footer class="bg-muted/60 border-t py-8">
		<Footer />
	</footer>
</div>
