<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	//components
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import PasswordInput from '$lib/components/password-input.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	//state
	let showPassword = $state(false);
	let submitting = $state(false);

	const linkClass = 'inline-block text-sm underline-offset-4 hover:underline text-primary/80';
</script>

<div class="flex min-h-svh items-center justify-center p-4 bg-primary">
	<Card.Root class="my-4 w-full max-w-lg">
		<Card.Header>
			<Card.Title>CivicScan</Card.Title>
			<Card.Description>Choose a new password</Card.Description>
		</Card.Header>
		{#if form?.done}
			<Card.Content>
				<p role="status">
					Your password has been changed. For your security, you've been signed out on all devices.
				</p>
			</Card.Content>
			<Card.Footer class="flex-col">
				<Button href={resolve('/login')} class="w-full">Log in</Button>
			</Card.Footer>
		{:else if !data.token || form?.invalid}
			<Card.Content>
				<p role="alert">
					This reset link is invalid or has expired. Links work once and last one hour.
				</p>
			</Card.Content>
			<Card.Footer class="flex-col">
				<Button href={resolve('/forgot-password')} class="w-full">Request a new link</Button>
				<a href={resolve('/login')} class="{linkClass} pt-3">Back to log in</a>
			</Card.Footer>
		{:else}
			<form
				method="POST"
				class="contents"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<input type="hidden" name="token" value={data.token} />
				<Card.Content>
					<div class="flex flex-col gap-6">
						<div class="grid gap-2">
							<Label for="password">New password</Label>
							<PasswordInput
								id="password"
								name="password"
								autocomplete="new-password"
								placeholder="At least 8 characters"
								bind:showPassword
							/>
						</div>
						<div class="grid gap-2">
							<Label for="confirmPassword">Confirm new password</Label>
							<PasswordInput
								id="confirmPassword"
								name="confirmPassword"
								autocomplete="new-password"
								placeholder="Re-enter your new password"
								bind:showPassword
							/>
						</div>
					</div>
					{#if form?.message}
						<p class="mt-4 text-sm text-destructive" role="alert">{form.message}</p>
					{/if}
				</Card.Content>
				<Card.Footer class="flex-col">
					<Button type="submit" class="w-full" disabled={submitting}>
						{submitting ? 'Saving…' : 'Set new password'}
					</Button>
				</Card.Footer>
			</form>
		{/if}
	</Card.Root>
</div>
