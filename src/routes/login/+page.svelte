<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	//components
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import PasswordInput from '$lib/components/password-input.svelte';
	import AuthPages from '$lib/components/auth-pages.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	//state
	let submitting = $state(false);
</script>

<div class="flex min-h-svh items-center justify-center p-4 bg-primary">
	<Card.Root class="my-4 w-full max-w-lg">
		<Card.Header>
			<Card.Title>CivicScan</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="mb-6">
				<AuthPages />
			</div>
		</Card.Content>
		<!-- contents: the form doesn't add a box, so the card layout stays the same -->
		<form
			method="POST"
			class="contents"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					submitting = false;
				};
			}}
		>
			<Card.Content>
				<div class="flex flex-col gap-6">
					<div class="grid gap-2">
						<Label for="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							placeholder="Enter your email"
							class="border-2 border-input pl-2"
							value={form?.email ?? ''}
							required
						/>
					</div>
					<div class="grid gap-2">
						<div class="flex items-center">
							<Label for="password">Password</Label>
						</div>
						<PasswordInput id="password" name="password" autocomplete="current-password" />
					</div>
				</div>
				{#if form?.message ?? data.linkError}
					<p class="mt-4 text-sm text-destructive" role="alert">
						{form?.message ?? data.linkError}
					</p>
				{/if}
			</Card.Content>
			<Card.Footer class="flex-col">
				<Button type="submit" class="w-full" disabled={submitting}>
					{submitting ? 'Logging in…' : 'Log In'}
				</Button>
				<a
					href={resolve('/forgot-password')}
					class="inline-block text-sm underline-offset-4 hover:underline text-primary/80 pt-3"
				>
					Forgot your password?
				</a>
			</Card.Footer>
		</form>
	</Card.Root>
</div>
