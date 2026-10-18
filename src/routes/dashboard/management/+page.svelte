<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import PasswordInput from '$lib/components/password-input.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type Staff = (typeof data.staff)[number];

	let pending = $state<string | null>(null);
	let showCreatePasswords = $state(false);
	let showResetPasswords = $state(false);
	let resettingId = $state<string | null>(null);
	let deleting = $state<Staff | null>(null);
	let deleteOpen = $state(false);

	const createValues = $derived(
		form?.section === 'create' && 'name' in form ? { name: form.name, email: form.email } : null
	);

	const submit =
		(key: string, after?: () => void): SubmitFunction =>
		() => {
			pending = key;
			return async ({ result, update }) => {
				await update();
				pending = null;
				if (result.type === 'success') after?.();
			};
		};

	function startReset(staff: Staff) {
		resettingId = resettingId === staff.id ? null : staff.id;
		showResetPasswords = false;
	}

	function confirmDelete(staff: Staff) {
		deleting = staff;
		deleteOpen = true;
	}
</script>

{#snippet feedback(section: string, userId?: string)}
	{#if form?.section === section && (!userId || ('userId' in form && form.userId === userId))}
		{#if 'message' in form && form.message}
			<p class="text-sm text-destructive" role="alert">{form.message}</p>
		{:else if 'success' in form && form.success}
			<p class="text-sm text-primary" role="status">{form.success}</p>
		{/if}
	{/if}
{/snippet}

<svelte:head>
	<title>Management - CivicScan</title>
</svelte:head>

<main class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
	<Card.Root>
		<Card.Header>
			<Card.Title>Create staff account</Card.Title>
			<Card.Description>
				Municipal staff log in with this email and password. Emails must end in
				<strong class="text-foreground">@{data.staffDomain}</strong>.
			</Card.Description>
		</Card.Header>
		<form method="POST" action="?/create" class="contents" use:enhance={submit('create')}>
			<Card.Content class="grid gap-4 md:grid-cols-2">
				<div class="grid gap-2">
					<Label for="name">Name</Label>
					<Input
						id="name"
						name="name"
						autocomplete="off"
						placeholder="Full name"
						class="border-2 border-input pl-2"
						value={createValues?.name ?? ''}
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						autocomplete="off"
						placeholder="name@{data.staffDomain}"
						class="border-2 border-input pl-2"
						value={createValues?.email ?? ''}
						required
					/>
				</div>
				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<PasswordInput
						id="password"
						name="password"
						autocomplete="new-password"
						placeholder="At least {data.minPasswordLength} characters"
						bind:showPassword={showCreatePasswords}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="confirmPassword">Confirm password</Label>
					<PasswordInput
						id="confirmPassword"
						name="confirmPassword"
						autocomplete="new-password"
						placeholder="Re-enter the password"
						bind:showPassword={showCreatePasswords}
					/>
				</div>
				<div class="md:col-span-2">{@render feedback('create')}</div>
			</Card.Content>
			<Card.Footer>
				<Button type="submit" disabled={pending === 'create'}>
					{pending === 'create' ? 'Creating…' : 'Create account'}
				</Button>
			</Card.Footer>
		</form>
	</Card.Root>

	<div class="flex flex-col gap-3">
		<div class="flex items-baseline justify-between gap-4">
			<h2 class="font-heading text-lg font-semibold">Municipal staff</h2>
			<span class="text-sm text-muted-foreground">
				{data.staff.length}
				{data.staff.length === 1 ? 'account' : 'accounts'}
			</span>
		</div>

		{@render feedback('list')}

		<div class="relative overflow-x-auto bg-card shadow-sm ring-1 ring-foreground/5">
			<table class="w-full text-sm">
				<thead>
					<tr
						class="bg-muted/50 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
					>
						<th class="px-5 py-3">Name</th>
						<th class="px-5 py-3">Email</th>
						<th class="px-5 py-3">Created</th>
						<th class="px-5 py-3"><span class="sr-only">Actions</span></th>
					</tr>
				</thead>
				<tbody>
					{#each data.staff as staff (staff.id)}
						<tr class="border-t">
							<td class="px-5 py-3 font-semibold">{staff.name}</td>
							<td class="px-5 py-3">{staff.email}</td>
							<td class="px-5 py-3 whitespace-nowrap text-muted-foreground">{staff.createdOn}</td>
							<td class="px-5 py-3 text-right whitespace-nowrap">
								<div class="flex justify-end gap-2">
									<Button
										variant="outline"
										size="sm"
										aria-expanded={resettingId === staff.id}
										onclick={() => startReset(staff)}
									>
										Set new password
									</Button>
									<Button variant="destructive" size="sm" onclick={() => confirmDelete(staff)}>
										Delete
									</Button>
								</div>
							</td>
						</tr>
						{#if resettingId === staff.id}
							<tr class="bg-muted/30">
								<td colspan="4" class="px-5 py-4">
									<form
										method="POST"
										action="?/setPassword"
										class="flex flex-col gap-3"
										use:enhance={submit(`password:${staff.id}`, () => (resettingId = null))}
									>
										<input type="hidden" name="userId" value={staff.id} />
										<div class="grid gap-3 md:grid-cols-2">
											<div class="grid gap-2">
												<Label for="reset-password-{staff.id}">New password for {staff.name}</Label>
												<PasswordInput
													id="reset-password-{staff.id}"
													name="password"
													autocomplete="new-password"
													placeholder="At least {data.minPasswordLength} characters"
													bind:showPassword={showResetPasswords}
												/>
											</div>
											<div class="grid gap-2">
												<Label for="reset-confirm-{staff.id}">Confirm new password</Label>
												<PasswordInput
													id="reset-confirm-{staff.id}"
													name="confirmPassword"
													autocomplete="new-password"
													placeholder="Re-enter the password"
													bind:showPassword={showResetPasswords}
												/>
											</div>
										</div>
										<p class="text-sm text-muted-foreground">
											This signs {staff.name} out on all their devices.
										</p>
										{@render feedback('password', staff.id)}
										<div class="flex flex-wrap gap-2">
											<Button type="submit" size="sm" disabled={pending === `password:${staff.id}`}>
												{pending === `password:${staff.id}` ? 'Saving…' : 'Save password'}
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onclick={() => (resettingId = null)}
											>
												Cancel
											</Button>
										</div>
									</form>
								</td>
							</tr>
						{/if}
					{:else}
						<tr class="border-t">
							<td colspan="4" class="px-5 py-10 text-center text-muted-foreground">
								No staff accounts yet. Create one above.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</main>

<AlertDialog.Root bind:open={deleteOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete this staff account?</AlertDialog.Title>
			<AlertDialog.Description>
				{#if deleting}
					<strong class="text-foreground">{deleting.name}</strong> ({deleting.email}) will no longer
					be able to log in. This can't be undone. Their report updates stay, credited to "Former
					staff member".
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<form
			method="POST"
			action="?/delete"
			use:enhance={() => {
				pending = 'delete';
				return async ({ update }) => {
					await update();
					pending = null;
					deleteOpen = false;
				};
			}}
		>
			<input type="hidden" name="userId" value={deleting?.id ?? ''} />
			<AlertDialog.Footer>
				<AlertDialog.Cancel type="button">Cancel</AlertDialog.Cancel>
				<Button type="submit" variant="destructive" disabled={pending === 'delete'}>
					{pending === 'delete' ? 'Deleting…' : 'Delete account'}
				</Button>
			</AlertDialog.Footer>
		</form>
	</AlertDialog.Content>
</AlertDialog.Root>
