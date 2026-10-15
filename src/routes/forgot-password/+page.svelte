<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	//components
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	//state
	let submitting = $state(false);
</script>

<div class="flex min-h-svh items-center justify-center p-4 bg-primary">
	<Card.Root class="my-4 w-full max-w-lg">
		<Card.Header>
			<Card.Title>CivicScan</Card.Title>
			<Card.Description>
				{form?.sent ? 'Check your inbox' : 'Reset your password'}
			</Card.Description>
		</Card.Header>
		{#if form?.sent}
			<Card.Content class="flex flex-col gap-4">
				<p>
					If an account exists for <strong>{form.sent}</strong>, we sent it a link to choose a new
					password.
				</p>
				<p class="text-sm text-muted-foreground">
					The link expires in one hour. Check your spam folder if you can't find it.
				</p>
			</Card.Content>
			<Card.Footer class="flex-col">
				<a
					href={resolve('/login')}
					class="inline-block text-sm underline-offset-4 hover:underline text-primary/80"
				>
					Back to log in
				</a>
			</Card.Footer>
		{:else}
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
					<p class="mb-6 text-sm text-muted-foreground">
						Enter the email you signed up with and we'll send you a link to reset your password.
					</p>
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
					{#if form?.message}
						<p class="mt-4 text-sm text-destructive" role="alert">{form.message}</p>
					{/if}
				</Card.Content>
				<Card.Footer class="flex-col">
					<Button type="submit" class="w-full" disabled={submitting}>
						{submitting ? 'Sending…' : 'Send reset link'}
					</Button>
					<a
						href={resolve('/login')}
						class="inline-block text-sm underline-offset-4 hover:underline text-primary/80 pt-3"
					>
						Back to log in
					</a>
				</Card.Footer>
			</form>
		{/if}
	</Card.Root>
</div>
