<script lang="ts">
  import { page } from '$app/state'
  import { ChevronRight, ArrowLeft } from '@lucide/svelte'
  import * as Item from '$lib/components/ui/item/index.js'
  import SubpageHeader from '$lib/components/layout/subpage-header/subpage-header.svelte'

  let errorMessage = $derived.by(() => {
    switch (page?.error?.type) {
      case 'LOUNGE_MISSING':
        return 'No lounge found'
      case 'validation':
        return 'Invalid lounge ID'
      case 'FORBIDDEN_ACCESS':
        return 'You do not have access to this lounge'
      default:
        return 'Unknown error'
    }
  })
</script>

<div class="flex flex-1 flex-col items-center mb-12 p-4">

  <SubpageHeader/>

  <div class="flex flex-col gap-2 items-center">
    <img src="/couch_error.webp"
         alt="Error"
         class="object-contain z-10 w-3/4 mb-12"/>
    <h1 class="text-muted-foreground">An error occurred while fetching lounge data:</h1>
    <h1 class="font-semibold text-2xl">{errorMessage}</h1>
  </div>

  <!-- Empty -->
  <div class="flex-1"></div>

  <div class="flex flex-col gap-6 justify-end">

    <Item.Root variant="outline">
      {#snippet child({props})}
        <a href="/home" {...props}>
          <Item.Content>
            <Item.Title>Completed Lounges</Item.Title>
            <Item.Description>
              List the lounges in which you participated.
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
            <Item.Title>Go Home</Item.Title>
            <Item.Description>
              View ongoing lounges or start a new one.
            </Item.Description>
          </Item.Content>
          <Item.Actions>
            <ChevronRight class="size-4"/>
          </Item.Actions>
        </a>
      {/snippet}
    </Item.Root>
  </div>

</div>