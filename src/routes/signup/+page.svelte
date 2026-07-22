<script lang="ts">
	//components
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	//state
	let showPassword = $state(false);
</script>

<div class="flex min-h-svh items-center justify-center p-4 bg-primary">
	<Card.Root class="my-4 w-full max-w-lg">
		<Card.Header>
			<Card.Title>CivicScan</Card.Title>
			<Card.Description>Create your account</Card.Description>
		</Card.Header>
		<Card.Content>
			<form>
				<div class="flex flex-col gap-6">
					<div class="grid gap-2">
						<Label for="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="Enter your email"
							class="border-2 border-input pl-2"
							required
						/>
					</div>
					<div class="grid gap-2">
						<div class="flex items-center">
							<Label for="password">Password</Label>
						</div>

						<div class="relative">
							<Input
								id="password"
								type={showPassword ? 'text' : 'password'}
								class="border-2 border-input pl-2"
								placeholder="Create a password"
								required
							/>

							<button
								type="button"
								onclick={() => (showPassword = !showPassword)}
								class="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
								aria-label={showPassword ? 'Hide password' : 'Show password'}
							>
								{showPassword ? 'HIDE' : 'SHOW'}
							</button>
						</div>
					</div>
					<div class="grid gap-2">
						<div class="flex items-center">
							<Label for="confirmPassword">Confirm password</Label>
						</div>

						<div class="relative">
							<Input
								id="confirmPassword"
								type={showPassword ? 'text' : 'password'}
								class="border-2 border-input pl-2"
								placeholder="Re-enter your password"
								required
							/>

							<button
								type="button"
								onclick={() => (showPassword = !showPassword)}
								class="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
								aria-label={showPassword ? 'Hide password' : 'Show password'}
							>
								{showPassword ? 'HIDE' : 'SHOW'}
							</button>
						</div>
					</div>
				</div>
			</form>
				<div>
					<div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
						<div class="flex space-x-2 text-primary/80">
							<p>By continuing, you agree to our <a href="#" class="underline">Terms</a> and <a href="#" class="underline">Privacy Policy</a>.</p>
						</div>
					</div>
				</div>
		</Card.Content>
		<Card.Footer class="flex-col">
			<Button type="submit" class="w-full">Sign Up</Button>
			<a
				href="#"
				class="inline-block text-sm underline-offset-4 hover:underline text-primary/80 pt-3"
			>
				Already have an account? Log in
			</a>
		</Card.Footer>
	</Card.Root>
</div>
