<script lang="ts">
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import { MAX_ADDRESS } from '$lib/reports';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		LocateFixedIcon,
		Location01Icon,
		MapPinIcon,
		Search01Icon
	} from '@hugeicons/core-free-icons';
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { untrack } from 'svelte';

	interface Props {
		lng: number | null;
		lat: number | null;
		address: string;
		error?: string;
		lockable?: boolean;
		mapClass?: string;
		id?: string;
	}

	let {
		lng = $bindable(),
		lat = $bindable(),
		address = $bindable(),
		error = '',
		lockable = false,
		mapClass = 'aspect-4/3',
		id = 'address'
	}: Props = $props();

	mapboxgl.accessToken = PUBLIC_MAPBOX_ACCESS_TOKEN;

	const defaultCenter: [number, number] = [22.9444, 40.6401];

	let locked = $state(untrack(() => lockable));
	let locating = $state(false);
	let searching = $state(false);
	let message = $state('');

	let mapContainer = $state<HTMLDivElement>();
	let map: mapboxgl.Map | undefined;
	let marker: mapboxgl.Marker | undefined;
	let geocodeRequest = 0;

	$effect(() => {
		const container = mapContainer;
		if (!container) return;

		untrack(() => {
			const pin: [number, number] | null = lng !== null && lat !== null ? [lng, lat] : null;
			map = new mapboxgl.Map({
				container,
				center: pin ?? defaultCenter,
				zoom: pin ? 16 : 13,
				attributionControl: false
			});
			map.addControl(new mapboxgl.NavigationControl(), 'top-right');
			map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
			map.on('click', (e) => {
				if (!locked) placePin(e.lngLat.toArray());
			});
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
			const m = new mapboxgl.Marker({ draggable: !locked }).setLngLat(pin).addTo(map);
			m.on('dragend', () => placePin(m.getLngLat().toArray()));
			marker = m;
		}
		marker.setLngLat(pin);
	}

	function toggleLock() {
		locked = !locked;
		marker?.setDraggable(!locked);
	}

	function placePin(pin: [number, number], { lookup = true, fly = false } = {}) {
		[lng, lat] = pin;
		message = '';
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
		message = '';
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
				message = 'No match for that address. Place the pin on the map instead.';
			}
		} catch {
			message = 'Address search is unavailable. Place the pin on the map instead.';
		} finally {
			searching = false;
		}
	}

	function useMyLocation() {
		if (!('geolocation' in navigator)) {
			message = "Your browser can't share its location. Place the pin on the map instead.";
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
				message =
					err.code === err.PERMISSION_DENIED
						? 'Location access was denied. Place the pin on the map instead.'
						: "Couldn't get your location. Place the pin on the map instead.";
			},
			{ enableHighAccuracy: true, timeout: 10_000 }
		);
	}
</script>

<div class="flex flex-col gap-4">
	<div class="bg-muted relative border {mapClass} {error ? 'border-destructive' : ''}">
		<div bind:this={mapContainer} class="size-full"></div>
		<Button
			variant="outline"
			size="icon"
			aria-label="Use my location"
			title="Use my location"
			class="bg-background absolute right-2 bottom-2 {locating ? 'animate-pulse' : ''}"
			disabled={locating}
			onclick={useMyLocation}
		>
			<HugeiconsIcon icon={LocateFixedIcon} strokeWidth={2} />
		</Button>
	</div>

	<div class="flex flex-col gap-2">
		<label for={id} class="text-xs font-semibold tracking-wide uppercase">
			Street Address or Cross Street
		</label>
		<div class="relative">
			<HugeiconsIcon
				icon={Location01Icon}
				strokeWidth={2}
				class="text-primary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
			/>
			<Input
				{id}
				bind:value={address}
				maxlength={MAX_ADDRESS}
				placeholder="Enter address manually..."
				class="bg-muted/40 h-11 border pr-11 pl-9"
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						findAddress();
					}
				}}
			/>
			<button
				type="button"
				aria-label="Find address"
				title="Find address"
				class="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center disabled:pointer-events-none disabled:opacity-40"
				disabled={searching || !address.trim()}
				onclick={findAddress}
			>
				<HugeiconsIcon icon={Search01Icon} strokeWidth={2} class="size-4" />
			</button>
		</div>
	</div>

	{#if lockable}
		<Button variant="outline" class="w-full" onclick={toggleLock}>
			<HugeiconsIcon icon={MapPinIcon} strokeWidth={2} />
			{locked ? 'Adjust Pin on Map' : 'Done Adjusting'}
		</Button>
	{/if}

	{#if error || message}
		<p class="text-destructive text-xs" role="alert">{error || message}</p>
	{:else if !locked}
		<p class="text-muted-foreground text-xs">
			Click the map or drag the pin to mark the exact spot.
		</p>
	{/if}
</div>
