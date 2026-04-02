<script lang="ts">
  import { getUserContext } from '$lib/userService.svelte'
  import { CircleCheckBig, ChevronRight } from '@lucide/svelte'
  import * as Item from '$lib/components/ui/item/index.js'
  import { goto } from '$app/navigation'

  const us = getUserContext()
  const isNewUser = Date.now() - new Date(us.user.createdAt).getTime() < 1000 * 60 * 60
  if (!isNewUser) goto('/home')

</script>

{#if isNewUser}

  <main class="flex h-full w-full flex-col items-center lg:w-md px-12 gap-6">

    <header class="flex w-full items-center mb-6 text-2xl font-bebas text-red-400/80">
      <span>Couch<span class="text-yellow-500 font-bold">|</span>Rift</span>
    </header>

    <div class="flex flex-col gap-2 items-center">
      <h2 class="font-semibold text-2xl flex items-center gap-2">
        <CircleCheckBig/>
        Registered
      </h2>
      <p>Your account was successfully created.</p>
    </div>

    <div class="flex flex-col gap-2 items-center">
      <img src="/popcorn_box.png" alt="A Popcorn Box" class="w-32"/>
      <p>Welcome, <b>{us.user.name}</b>! <br/> You're now ready to ...</p>
    </div>

    <div class="flex flex-1 flex-col gap-6 justify-center">

      <Item.Root variant="outline">
        {#snippet child({props})}
          <a href="/me" {...props}>
            <Item.Content>
              <Item.Title>Complete Your Profile</Item.Title>
              <Item.Description>
                Edit preferences, add a distinctive avatar.
              </Item.Description>
            </Item.Content>
            <Item.Actions>
              <ChevronRight class="size-4"/>
            </Item.Actions>
          </a>
        {/snippet}
      </Item.Root>

      <Item.Root variant="outline">
        {#snippet child({props})}
          <a href="/lounges/new" {...props}>
            <Item.Content>
              <Item.Title>Create a Lounge</Item.Title>
              <Item.Description>
                Start a lounge and invite friends.
              </Item.Description>
            </Item.Content>
            <Item.Actions>
              <ChevronRight class="size-4"/>
            </Item.Actions>
          </a>
        {/snippet}
      </Item.Root>

      <Item.Root variant="outline">
        {#snippet child({props})}
          <a href="/home" {...props}>
            <Item.Content>
              <Item.Title>Join a Lounge</Item.Title>
              <Item.Description>
                Start swiping right now.
              </Item.Description>
            </Item.Content>
            <Item.Actions>
              <ChevronRight class="size-4"/>
            </Item.Actions>
          </a>
        {/snippet}
      </Item.Root>

    </div>

    <section class="flex flex-col text-xs text-muted-foreground italic">© 2026 Silktrader</section>
  </main>

{/if}