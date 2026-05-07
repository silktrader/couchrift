<script lang="ts">
  import { Input } from '$lib/components/ui/input'
  import { Button } from '$lib/components/ui/button'
  import * as Field from '$lib/components/ui/field'
  import { goto } from '$app/navigation'
  import { authClient } from '$lib/auth-client'
  import { LoginSchema, type Login } from '@couchrift/shared'
  import { LoaderPinwheel, CircleAlert, EyeOff, Eye } from '@lucide/svelte'
  import { Value } from '@sinclair/typebox/value'
  import { Toggle } from '$lib/components/ui/toggle'
  import { SvelteSet } from 'svelte/reactivity'

  let httpError = $state('')
  let showPassword = $state(false)

  let form = $state<Login>(Value.Create(LoginSchema))
  let errors: Partial<Record<keyof Login, string>> = $state({})
  let touched = $state(new SvelteSet<keyof Login>())

  let isSubmitting = $state(false)
  let isValid = $derived(Value.Check(LoginSchema, form))
  let cantSubmit = $derived(isSubmitting || !isValid)

  function validate() {
    // Single properties check would break cross-field validation where one field depends on another
    if (isValid) {
      errors = {}
      return true
    }

    // Populate errors
    let newErrors: Partial<Record<keyof Login, string>> = {}
    for (const error of Value.Errors(LoginSchema, form)) {
      const field = error.path.substring(1) as keyof Login
      // Skip setting error message if the input is untainted
      if (touched.has(field)) newErrors[field] = error.message
    }
    errors = newErrors
    return false
  }

  function handleBlur(field: keyof Login) {
    touched.add(field)
    httpError = ''
    validate()
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!validate()) return
    isSubmitting = true
    const { error } = await authClient.signIn.email({
      email:      form.email,
      password:   form.password,
      rememberMe: true
    })
    isSubmitting = false

    if (error) {
      switch (error.code) {
        default:
          httpError = error.statusText
      }
      return
    }

    await goto('/home', { replaceState: true })
  }
</script>

<div class="flex flex-1 w-full flex-col px-12 justify-between">

  <header class="flex w-full items-center mb-6 text-2xl font-bebas text-red-400/80">
    <!--     <img src="/crimson_couch.png" alt="Couch Rift Logo" class="size-18"/> -->
    <span>Couch<span class="text-yellow-500 font-bold">|</span>Rift</span>
  </header>

  <form onsubmit={handleSubmit} class="flex w-full flex-col justify-center">

    <div class="flex flex-col items-center justify-end gap-4 pb-12 text-center">
      <h1 class="text-xl font-bold">Welcome back!</h1>
      <p class="text-sm text-balance text-muted-foreground">
        Enter your credentials to sign into your account.
      </p>
    </div>

    <Field.Group>

      <Field.Field data-invalid={!!errors.email}>
        <Field.Label>Email</Field.Label>
        <Input
            id="email"
            type="email"
            bind:value={form.email}
            onblur={() => handleBlur('email')}
            required
            autofocus
            autocomplete="email"
            inputmode="email"
        />
        <Field.Error class="min-h-5">
          {#if errors.email}
            {errors.email}
          {/if}
        </Field.Error>
      </Field.Field>

      <Field.Field data-invalid={!!errors.password}>
        <Field.Label>Password</Field.Label>
        <div class="relative">
          <Input
              type={showPassword ? 'text' : 'password'}
              class="font-mono"
              bind:value={form.password}
              onblur={() => handleBlur('password')}
              required
              autocomplete="current-password"
          />

          <Toggle
              bind:pressed={showPassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              size="sm"
              tabindex={-1}
              class="data-[state=on]:bg-transparent absolute top-1/2 right-2 size-9 min-w-0 -translate-y-1/2 p-0 hover:bg-transparent! data-[state=off]:text-muted-foreground hover:data-[state=off]:text-accent-foreground data-[state=on]:text-muted-foreground hover:data-[state=on]:text-accent-foreground"
          >
            {#if showPassword}
              <EyeOff class="size-4"/>
            {:else}
              <Eye class="size-4"/>
            {/if}
          </Toggle>
        </div>
        <Field.Error class="min-h-5">
          {#if errors.password}
            {errors.password}
          {/if}
        </Field.Error>
      </Field.Field>

    </Field.Group>

    <div class="flex min-h-6 items-center justify-center gap-2 text-sm text-destructive">
      {#if httpError}
        <CircleAlert class="size-4"/>
        <span>{httpError}</span>
      {/if}
    </div>

    <section class="flex flex-col gap-6">
      <Button type="submit" disabled={cantSubmit}>
        {#if isSubmitting}
          <span class="flex items-center gap-2">
            <LoaderPinwheel class="size-6 animate-spin"/>
            Signing In
          </span>
        {:else}
          Sign In
        {/if}
      </Button>
      <Field.Separator>or</Field.Separator>
      <Button variant="outline" href="/register">Register</Button>
    </section>
  </form>

  <section class="flex flex-col text-xs text-muted-foreground italic items-center">© 2026 Silktrader</section>
</div>