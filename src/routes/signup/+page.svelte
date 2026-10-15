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
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	//state
	let showPassword = $state(false);
	let submitting = $state(false);

	const submit: SubmitFunction = () => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	};
</script>

<div class="flex min-h-svh items-center justify-center p-4 bg-primary">
	<Card.Root class="my-4 w-full max-w-lg">
		<Card.Header>
			<Card.Title>CivicScan</Card.Title>
			<Card.Description>
				{form?.sent ? 'Check your inbox' : 'Create your account'}
			</Card.Description>
		</Card.Header>
		{#if form?.sent}
			<Card.Content class="flex flex-col gap-4">
				<p>
					We sent a verification link to <strong>{form.sent}</strong>. Click it to activate your
					account and sign in.
				</p>
				<p class="text-sm text-muted-foreground">
					The link expires in one hour. Check your spam folder if you can't find it.
				</p>
				{#if form.resent}
					<p class="text-sm text-primary" role="status">A new link is on its way.</p>
				{/if}
			</Card.Content>
			<form method="POST" action="?/resend" class="contents" use:enhance={submit}>
				<input type="hidden" name="email" value={form.sent} />
				<Card.Footer class="flex-col">
					<Button type="submit" variant="outline" class="w-full" disabled={submitting}>
						{submitting ? 'Sending…' : 'Resend email'}
					</Button>
					<a
						href={resolve('/login')}
						class="inline-block text-sm underline-offset-4 hover:underline text-primary/80 pt-3"
					>
						Back to log in
					</a>
				</Card.Footer>
			</form>
		{:else}
			<Card.Content>
				<div class="mb-6">
					<AuthPages />
				</div>
			</Card.Content>
			<form method="POST" action="?/signup" class="contents" use:enhance={submit}>
				<Card.Content>
					<div class="flex flex-col gap-6">
						<div class="grid gap-2">
							<Label for="name">Full name</Label>
							<Input
								id="name"
								name="name"
								autocomplete="name"
								placeholder="Enter your full name"
								class="border-2 border-input pl-2"
								value={form?.name ?? ''}
								required
							/>
						</div>
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
							<PasswordInput
								id="password"
								name="password"
								autocomplete="new-password"
								placeholder="At least 8 characters"
								bind:showPassword
							/>
						</div>
						<div class="grid gap-2">
							<div class="flex items-center">
								<Label for="confirmPassword">Confirm password</Label>
							</div>
							<PasswordInput
								id="confirmPassword"
								name="confirmPassword"
								autocomplete="new-password"
								placeholder="Re-enter your password"
								bind:showPassword
							/>
						</div>
					</div>
					<div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
						<div class="flex space-x-2 text-primary/80">
							<p>
								By continuing, you agree to our <a href={resolve('/terms')} class="underline"
									>Terms</a
								>
								and
								<a href={resolve('/privacy')} class="underline">Privacy Policy</a>.
							</p>
						</div>
					</div>
					{#if form?.message}
						<p class="mt-4 text-sm text-destructive" role="alert">{form.message}</p>
					{/if}
				</Card.Content>
				<Card.Footer class="flex-col">
					<Button type="submit" class="w-full" disabled={submitting}>
						{submitting ? 'Creating account…' : 'Sign Up'}
					</Button>
					<a
						href={resolve('/login')}
						class="inline-block text-sm underline-offset-4 hover:underline text-primary/80 pt-3"
					>
						Already have an account? Log in
					</a>
				</Card.Footer>
			</form>
		{/if}
	</Card.Root>
</div>
