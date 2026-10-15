<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import TopBar from '$lib/dashboard/top-bar.svelte';
	import Footer from '$lib/dashboard/footer.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import PasswordInput from '$lib/components/password-input.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type Section = 'name' | 'email' | 'password' | 'delete';

	let pending = $state<Section | null>(null);
	let showPasswords = $state(false);
	let confirmingDelete = $state(false);

	const submit =
		(section: Section, reset = false): SubmitFunction =>
		() => {
			pending = section;
			return async ({ update }) => {
				await update({ reset });
				pending = null;
			};
		};

	const messageFor = (section: Section) => (form?.section === section ? form : null);
</script>

{#snippet feedback(section: Section)}
	{@const result = messageFor(section)}
	{#if result && 'message' in result && result.message}
		<p class="text-sm text-destructive" role="alert">{result.message}</p>
	{:else if result && 'success' in result && result.success}
		<p class="text-sm text-primary" role="status">{result.success}</p>
	{/if}
{/snippet}

<svelte:head>
	<title>Account Settings - CivicScan</title>
</svelte:head>

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

		<h1 class="font-heading text-primary mt-4 text-4xl font-extrabold tracking-tight">
			Account Settings
		</h1>
		<p class="text-muted-foreground mt-2">Manage your profile, sign-in details and account.</p>

		<div class="mt-8 flex flex-col gap-6">
			<Card.Root>
				<Card.Header>
					<Card.Title>Profile</Card.Title>
					<Card.Description>The name staff see on your reports.</Card.Description>
				</Card.Header>
				<form method="POST" action="?/name" class="contents" use:enhance={submit('name')}>
					<Card.Content class="flex flex-col gap-4">
						<div class="grid gap-2">
							<Label for="name">Full name</Label>
							<Input
								id="name"
								name="name"
								autocomplete="name"
								class="border-2 border-input pl-2"
								value={data.name}
								required
							/>
						</div>
						{@render feedback('name')}
					</Card.Content>
					<Card.Footer>
						<Button type="submit" disabled={pending === 'name'}>
							{pending === 'name' ? 'Saving…' : 'Save name'}
						</Button>
					</Card.Footer>
				</form>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Email</Card.Title>
					<Card.Description>
						Your current email is <strong class="text-foreground">{data.email}</strong>.
					</Card.Description>
				</Card.Header>
				<form method="POST" action="?/email" class="contents" use:enhance={submit('email', true)}>
					<Card.Content class="flex flex-col gap-4">
						{#if data.emailNotice && !form}
							<p
								class="text-sm {data.emailNoticeIsError ? 'text-destructive' : 'text-primary'}"
								role={data.emailNoticeIsError ? 'alert' : 'status'}
							>
								{data.emailNotice}
							</p>
						{/if}
						<div class="grid gap-2">
							<Label for="email">New email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								autocomplete="email"
								placeholder="Enter your new email"
								class="border-2 border-input pl-2"
								required
							/>
						</div>
						<p class="text-muted-foreground text-sm">
							For your security, we first email your current address to approve the change, then
							send a confirmation link to the new one. Your email changes once you click both.
						</p>
						{@render feedback('email')}
					</Card.Content>
					<Card.Footer>
						<Button type="submit" disabled={pending === 'email'}>
							{pending === 'email' ? 'Sending…' : 'Send approval link'}
						</Button>
					</Card.Footer>
				</form>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Password</Card.Title>
					<Card.Description>
						Changing your password signs you out on your other devices.
					</Card.Description>
				</Card.Header>
				<form
					method="POST"
					action="?/password"
					class="contents"
					use:enhance={submit('password', true)}
				>
					<Card.Content class="flex flex-col gap-4">
						<div class="grid gap-2">
							<Label for="currentPassword">Current password</Label>
							<PasswordInput
								id="currentPassword"
								name="currentPassword"
								autocomplete="current-password"
								placeholder="Enter your current password"
								bind:showPassword={showPasswords}
							/>
						</div>
						<div class="grid gap-2">
							<Label for="newPassword">New password</Label>
							<PasswordInput
								id="newPassword"
								name="newPassword"
								autocomplete="new-password"
								placeholder="At least 8 characters"
								bind:showPassword={showPasswords}
							/>
						</div>
						<div class="grid gap-2">
							<Label for="confirmPassword">Confirm new password</Label>
							<PasswordInput
								id="confirmPassword"
								name="confirmPassword"
								autocomplete="new-password"
								placeholder="Re-enter your new password"
								bind:showPassword={showPasswords}
							/>
						</div>
						{@render feedback('password')}
					</Card.Content>
					<Card.Footer>
						<Button type="submit" disabled={pending === 'password'}>
							{pending === 'password' ? 'Saving…' : 'Change password'}
						</Button>
					</Card.Footer>
				</form>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Sign out</Card.Title>
					<Card.Description>Sign out of CivicScan on this device.</Card.Description>
				</Card.Header>
				<Card.Footer>
					<form method="POST" action={resolve('/logout')}>
						<Button type="submit" variant="outline">Sign out</Button>
					</form>
				</Card.Footer>
			</Card.Root>

			{#if !data.isStaff}
				<Card.Root class="ring-destructive/40">
					<Card.Header>
						<Card.Title class="text-destructive">Delete account</Card.Title>
						<Card.Description>
							This permanently deletes your account and can't be undone. Reports that staff haven't
							reviewed yet are deleted along with their photos. Reports already being handled stay
							on the public record, with your name removed.
						</Card.Description>
					</Card.Header>
					{#if confirmingDelete}
						<form method="POST" action="?/delete" class="contents" use:enhance={submit('delete')}>
							<Card.Content class="flex flex-col gap-4">
								<div class="grid gap-2">
									<Label for="deletePassword">Enter your password to confirm</Label>
									<PasswordInput
										id="deletePassword"
										name="password"
										autocomplete="current-password"
										placeholder="Your password"
									/>
								</div>
								{@render feedback('delete')}
							</Card.Content>
							<Card.Footer class="flex flex-wrap gap-2">
								<Button type="submit" variant="destructive" disabled={pending === 'delete'}>
									{pending === 'delete' ? 'Deleting…' : 'Permanently delete account'}
								</Button>
								<Button type="button" variant="outline" onclick={() => (confirmingDelete = false)}>
									Cancel
								</Button>
							</Card.Footer>
						</form>
					{:else}
						<Card.Footer>
							<Button variant="destructive" onclick={() => (confirmingDelete = true)}>
								Delete account…
							</Button>
						</Card.Footer>
					{/if}
				</Card.Root>
			{/if}
		</div>
	</main>

	<footer class="bg-muted/60 border-t py-8">
		<Footer />
	</footer>
</div>
