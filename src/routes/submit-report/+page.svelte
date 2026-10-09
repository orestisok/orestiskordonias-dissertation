<script lang="ts">
	import { enhance } from '$app/forms';
	import { pushState, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import { MAX_PHOTOS, PHOTO_TYPES, photoError } from '$lib/photos';
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
		SendIcon,
		Search01Icon,
		Cancel01Icon
	} from '@hugeicons/core-free-icons';
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESS_TOKEN;

	const steps = [
		{ n: 1, label: 'Issue Details', short: 'Details' },
		{ n: 2, label: 'Location & Photos', short: 'Location' },
		{ n: 3, label: 'Review & Submit', short: 'Review' }
	] as const;

	const current = $derived(page.state.step ?? 1);

	function goToStep(step: number) {
		pushState('', { step });
	}

	const MAX_TITLE = 120;
	const MIN_DESCRIPTION = 20;
	const MAX_DESCRIPTION = 2000;
	const MAX_ADDRESS = 255;

	let title = $state('');
	let categoryId = $state<number | ''>('');
	let description = $state('');

	const categoryName = $derived(data.categories.find((c) => c.id === categoryId)?.name ?? '');

	let attempted = $state(false);
	const detailsValid = $derived(
		title.trim() !== '' && categoryId !== '' && description.trim().length >= MIN_DESCRIPTION
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

	function nextFromDetails() {
		attempted = true;
		if (detailsValid) goToStep(2);
	}

	const defaultCenter: [number, number] = [22.9444, 40.6401];

	let lng = $state<number | null>(null);
	let lat = $state<number | null>(null);
	let address = $state('');
	let locating = $state(false);
	let searching = $state(false);
	let locationMessage = $state('');

	let locationAttempted = $state(false);
	const locationValid = $derived(lng !== null && lat !== null);
	const locationError = $derived(
		locationAttempted && !locationValid
			? 'Please choose a location on the map or use your location.'
			: ''
	);

	let mapContainer = $state<HTMLDivElement>();
	let map: mapboxgl.Map | undefined;
	let marker: mapboxgl.Marker | undefined;
	let geocodeRequest = 0;

	$effect(() => {
		const container = mapContainer;
		if (!container) return;

		untrack(() => {
			const pin: [number, number] | null = lng !== null && lat !== null ? [lng, lat] : null;
			map = new mapboxgl.Map({ container, center: pin ?? defaultCenter, zoom: pin ? 16 : 13 });
			map.addControl(new mapboxgl.NavigationControl(), 'top-right');
			map.on('click', (e) => placePin(e.lngLat.toArray()));
			if (pin) showMarker(pin);
		});

		return () => {
			map?.remove();
			map = undefined;
			marker = undefined;
		};
	});

	function showMarker(pin: [number, number]) {
		if (!map) return;
		if (!marker) {
			const m = new mapboxgl.Marker({ draggable: true }).setLngLat(pin).addTo(map);
			m.on('dragend', () => placePin(m.getLngLat().toArray()));
			marker = m;
		}
		marker.setLngLat(pin);
	}

	function placePin(pin: [number, number], { lookup = true, fly = false } = {}) {
		[lng, lat] = pin;
		locationMessage = '';
		showMarker(pin);
		if (fly) map?.flyTo({ center: pin, zoom: Math.max(map.getZoom(), 16) });

		const request = ++geocodeRequest;
		if (lookup) void reverseGeocode(pin, request);
	}

	interface GeocodeFeature {
		geometry: { coordinates: [number, number] };
		properties: { name: string; full_address?: string };
	}

	async function geocode(endpoint: 'forward' | 'reverse', params: Record<string, string>) {
		const url = new URL(`https://api.mapbox.com/search/geocode/v6/${endpoint}`);
		for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
		url.searchParams.set('access_token', PUBLIC_MAPBOX_ACCESS_TOKEN);

		const res = await fetch(url);
		if (!res.ok) throw new Error(`Geocoding failed with ${res.status}`);
		const body: { features: GeocodeFeature[] } = await res.json();
		return body.features[0] as GeocodeFeature | undefined;
	}

	function addressOf(feature: GeocodeFeature) {
		return (feature.properties.full_address ?? feature.properties.name).slice(0, MAX_ADDRESS);
	}

	async function reverseGeocode([lon, la]: [number, number], request: number) {
		const feature = await geocode('reverse', {
			longitude: String(lon),
			latitude: String(la)
		}).catch(() => undefined);
		if (feature && request === geocodeRequest) address = addressOf(feature);
	}

	async function findAddress() {
		const query = address.trim();
		if (!query || searching) return;

		searching = true;
		locationMessage = '';
		try {
			const center = map?.getCenter().toArray() ?? defaultCenter;
			const feature = await geocode('forward', {
				q: query,
				proximity: center.join(','),
				limit: '1'
			});
			if (feature) {
				placePin(feature.geometry.coordinates, { lookup: false, fly: true });
				address = addressOf(feature);
			} else {
				locationMessage = 'No match for that address. Place the pin on the map instead.';
			}
		} catch {
			locationMessage = 'Address search is unavailable. Place the pin on the map instead.';
		} finally {
			searching = false;
		}
	}

	function useMyLocation() {
		if (!('geolocation' in navigator)) {
			locationMessage = "Your browser can't share its location. Place the pin on the map instead.";
			return;
		}

		locating = true;
		navigator.geolocation.getCurrentPosition(
			(position) => {
				locating = false;
				placePin([position.coords.longitude, position.coords.latitude], { fly: true });
			},
			(err) => {
				locating = false;
				locationMessage =
					err.code === err.PERMISSION_DENIED
						? 'Location access was denied. Place the pin on the map instead.'
						: "Couldn't get your location. Place the pin on the map instead.";
			},
			{ enableHighAccuracy: true, timeout: 10_000 }
		);
	}

	let photos = $state<{ file: File; url: string }[]>([]);
	let photoErrors = $state<string[]>([]);
	let dragging = $state(false);

	const emptySlots = $derived(Array.from({ length: MAX_PHOTOS - photos.length }, (_, i) => i));

	function addPhotos(files: FileList | null | undefined) {
		const errors: string[] = [];
		for (const file of files ?? []) {
			const message = photoError(file);
			if (message) {
				errors.push(message);
			} else if (photos.length >= MAX_PHOTOS) {
				errors.push(`You can add up to ${MAX_PHOTOS} photos.`);
				break;
			} else {
				photos.push({ file, url: URL.createObjectURL(file) });
			}
		}
		photoErrors = errors;
	}

	function removePhoto(index: number) {
		URL.revokeObjectURL(photos[index].url);
		photos.splice(index, 1);
		photoErrors = [];
	}

	$effect(() => () => {
		for (const photo of photos) URL.revokeObjectURL(photo.url);
	});

	function nextFromLocation() {
		locationAttempted = true;
		if (locationValid) goToStep(3);
	}

	let submitting = $state(false);

	$effect(() => {
		if (current > 1 && !detailsValid) {
			attempted = true;
			replaceState('', { step: 1 });
		} else if (current > 2 && !locationValid) {
			locationAttempted = true;
			replaceState('', { step: 2 });
		}
	});
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

			<Card.Root class="px-6 py-6 md:px-8 md:py-8">
				{#if current === 1}
					<Card.Title class="normal-case tracking-normal">Describe the Issue</Card.Title>

					<div class="flex flex-col gap-6">
						<div class="flex flex-col gap-2">
							<label for="title" class="text-xs font-semibold tracking-wide uppercase">
								Title
							</label>
							<Input
								id="title"
								bind:value={title}
								maxlength={MAX_TITLE}
								aria-invalid={!!titleError}
								aria-describedby={titleError ? 'title-error' : undefined}
								placeholder="e.g. Deep pothole outside the school gate"
								class="bg-muted/40 aria-invalid:border-destructive h-11 border px-3"
							/>
							{#if titleError}
								<p id="title-error" class="text-destructive text-xs" role="alert">
									{titleError}
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<label for="category" class="text-xs font-semibold tracking-wide uppercase">
								Issue Category
							</label>
							<div class="relative">
								<select
									id="category"
									bind:value={categoryId}
									aria-invalid={!!categoryError}
									aria-describedby={categoryError ? 'category-error' : undefined}
									class="border-input bg-muted/40 focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive h-11 w-full appearance-none border px-3 pr-10 text-sm outline-none focus-visible:ring-2 {categoryId !==
									''
										? 'text-foreground'
										: 'text-muted-foreground'}"
								>
									<option value="" disabled selected>Select a category...</option>
									{#each data.categories as c (c.id)}
										<option value={c.id} class="text-foreground">{c.name}</option>
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
								Description
							</label>
							<Textarea
								id="description"
								bind:value={description}
								maxlength={MAX_DESCRIPTION}
								aria-invalid={!!descriptionError}
								aria-describedby="description-hint"
								placeholder="Please provide specific details about the issue..."
								class="min-h-32"
							/>
							<div class="flex justify-between gap-4 text-xs">
								{#if descriptionError}
									<p id="description-hint" class="text-destructive" role="alert">
										{descriptionError}
									</p>
								{:else}
									<p id="description-hint" class="text-muted-foreground">
										Min. {MIN_DESCRIPTION} characters required.
									</p>
								{/if}
								<span
									class="shrink-0 tabular-nums {descriptionError
										? 'text-destructive'
										: 'text-muted-foreground'}"
								>
									{description.trim().length}/{MIN_DESCRIPTION}
								</span>
							</div>
						</div>
					</div>

					<div class="flex justify-end">
						<Button onclick={nextFromDetails}>
							Next: Location & Photos
							<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
						</Button>
					</div>
				{:else if current === 2}
					<Card.Title class="normal-case tracking-normal">Where is it happening?</Card.Title>

					<div class="grid gap-6 md:grid-cols-2">
						<div class="flex flex-col gap-2">
							<p class="text-xs font-semibold tracking-wide uppercase">Geolocation</p>
							<div
								class="bg-muted relative aspect-4/3 border {locationError
									? 'border-destructive'
									: ''}"
							>
								<div bind:this={mapContainer} class="size-full"></div>
								<Button
									variant="outline"
									size="sm"
									class="bg-background absolute top-2 left-2"
									disabled={locating}
									onclick={useMyLocation}
								>
									<HugeiconsIcon icon={LocateFixedIcon} strokeWidth={2} />
									{locating ? 'Locating…' : 'Use My Location'}
								</Button>
							</div>
							<form
								class="flex gap-2"
								onsubmit={(e) => {
									e.preventDefault();
									findAddress();
								}}
							>
								<Input
									bind:value={address}
									maxlength={MAX_ADDRESS}
									aria-label="Address"
									placeholder="Enter address manually..."
									class="bg-muted/40 border px-3"
								/>
								<Button type="submit" variant="outline" disabled={searching || !address.trim()}>
									<HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
									{searching ? 'Finding…' : 'Find'}
								</Button>
							</form>
							{#if locationError || locationMessage}
								<p class="text-destructive text-xs" role="alert">
									{locationError || locationMessage}
								</p>
							{:else}
								<p class="text-muted-foreground text-xs">
									Click the map or drag the pin to mark the exact spot.
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<p class="text-xs font-semibold tracking-wide uppercase">
								Photo Upload <span class="text-muted-foreground font-normal normal-case"
									>(optional)</span
								>
							</p>
							<label
								class="bg-muted/40 hover:bg-muted flex aspect-4/3 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed text-center transition-colors {dragging
									? 'border-primary bg-muted'
									: ''}"
								ondragover={(e) => {
									e.preventDefault();
									dragging = true;
								}}
								ondragleave={() => (dragging = false)}
								ondrop={(e) => {
									e.preventDefault();
									dragging = false;
									addPhotos(e.dataTransfer?.files);
								}}
							>
								<input
									type="file"
									accept={PHOTO_TYPES.join(',')}
									multiple
									class="sr-only"
									onchange={(e) => {
										addPhotos(e.currentTarget.files);
										e.currentTarget.value = '';
									}}
								/>
								<HugeiconsIcon
									icon={ImagePlusIcon}
									strokeWidth={2}
									class="text-muted-foreground size-8"
								/>
								<span class="text-sm font-semibold">Drag &amp; Drop or Browse</span>
								<span class="text-muted-foreground text-xs">
									Up to {MAX_PHOTOS} photos, max 10MB each. Formats: JPG, PNG
								</span>
							</label>
							{#if photoErrors.length}
								<ul class="text-destructive text-xs" role="alert">
									{#each photoErrors as message, i (i)}
										<li>{message}</li>
									{/each}
								</ul>
							{/if}
							<div class="grid grid-cols-4 gap-2">
								{#each photos as photo, i (photo.url)}
									<div class="relative aspect-square border">
										<img src={photo.url} alt="Upload {i + 1}" class="size-full object-cover" />
										<button
											type="button"
											aria-label="Remove photo {i + 1}"
											class="bg-background/90 hover:bg-background absolute top-1 right-1 flex size-6 items-center justify-center border"
											onclick={() => removePhoto(i)}
										>
											<HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} class="size-3.5" />
										</button>
									</div>
								{/each}
								{#each emptySlots as slot (slot)}
									<div class="bg-muted flex aspect-square items-center justify-center border">
										<HugeiconsIcon
											icon={Image01Icon}
											strokeWidth={2}
											class="text-muted-foreground size-5"
										/>
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
						<Button onclick={nextFromLocation}>
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
								<p class="mt-2 font-semibold">{title}</p>
								<p class="text-muted-foreground mt-1 text-xs font-semibold tracking-wide uppercase">
									{categoryName}
								</p>
								<p class="text-muted-foreground mt-2 text-sm whitespace-pre-line">
									{description}
								</p>
							</div>
							<div>
								<p class="text-primary text-xs font-semibold tracking-wide uppercase">Location</p>
								<p class="mt-2 flex items-center gap-1.5 text-sm">
									<HugeiconsIcon
										icon={MapPinIcon}
										strokeWidth={2}
										class="text-muted-foreground size-4 shrink-0"
									/>
									{address.trim() || `${lat?.toFixed(5)}, ${lng?.toFixed(5)}`}
								</p>
							</div>
						</div>

						{#if photos.length}
							<div>
								<p class="text-primary text-xs font-semibold tracking-wide uppercase">
									Photos ({photos.length})
								</p>
								<div class="mt-2 grid grid-cols-4 gap-2">
									{#each photos as photo, i (photo.url)}
										<img
											src={photo.url}
											alt="Upload {i + 1}"
											class="aspect-square size-full border object-cover"
										/>
									{/each}
								</div>
							</div>
						{/if}

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

					{#if form?.message}
						<p class="text-destructive text-sm" role="alert">{form.message}</p>
					{/if}

					<form
						method="POST"
						enctype="multipart/form-data"
						class="flex items-center justify-between"
						use:enhance={({ formData }) => {
							for (const photo of photos) formData.append('photos', photo.file);
							submitting = true;
							return async ({ update }) => {
								await update({ reset: false });
								submitting = false;
							};
						}}
					>
						<input type="hidden" name="title" value={title} />
						<input type="hidden" name="categoryId" value={categoryId} />
						<input type="hidden" name="description" value={description} />
						<input type="hidden" name="lng" value={lng ?? ''} />
						<input type="hidden" name="lat" value={lat ?? ''} />
						<input type="hidden" name="address" value={address} />

						<Button variant="outline" disabled={submitting} onclick={() => goToStep(2)}>
							<HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
							Previous
						</Button>
						<Button type="submit" disabled={submitting}>
							<HugeiconsIcon icon={SendIcon} strokeWidth={2} />
							{submitting ? 'Submitting…' : 'Submit Final Report'}
						</Button>
					</form>
				{/if}
			</Card.Root>
		</div>
	</main>

	<footer class="bg-muted/60 border-t py-8">
		<Footer />
	</footer>
</div>
