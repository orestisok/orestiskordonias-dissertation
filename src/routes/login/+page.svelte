<script lang="ts">
	import { enhance } from '$app/forms';
	//components
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import PasswordInput from '$lib/components/password-input.svelte';
	import AuthPages from '$lib/components/auth-pages.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

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
				<div>
					<div>
						<div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
							<div class="flex items-center space-x-2">
								<Checkbox id="remember" name="remember" />
								<Label for="remember">Remember for 30 days</Label>
							</div>
						</div>
					</div>
				</div>
				{#if form?.message}
					<p class="mt-4 text-sm text-destructive" role="alert">{form.message}</p>
				{/if}
			</Card.Content>
			<Card.Footer class="flex-col">
				<Button type="submit" class="w-full" disabled={submitting}>
					{submitting ? 'Logging in…' : 'Log In'}
				</Button>
				<a
					href="##"
					class="inline-block text-sm underline-offset-4 hover:underline text-primary/80 pt-3"
				>
					Forgot your password?
				</a>
			</Card.Footer>
		</form>
	</Card.Root>
</div>
