<script lang="ts">
  import * as Item from '$lib/components/ui/item'
  import type { Swipe } from '@couchrift/shared/schemas/swipes.ts'
  import { Heart, X } from '@lucide/svelte/icons'
  import { formatRelativeTime } from '$lib/dates'
  import { ScrollArea } from '$lib/components/ui/scroll-area'

  let { swipes }: { swipes: Swipe[] } = $props()
  let orderedSwipes = $derived(swipes.toSorted((a, b) => a.swipedAt - b.swipedAt))

</script>

<ScrollArea class="h-full w-full">
  <section class="flex flex-col w-full gap-2 items-center pr-4">

    {#each orderedSwipes as swipe (swipe.id)}
      <Item.Root variant="outline" size="sm">
        <Item.Media variant="image">
          {#if swipe.like}
            <Heart class="size-6 fill-foreground stroke-background stroke-1"/>
          {:else}
            <X class="size-6 stroke-4"/>
          {/if}
        </Item.Media>
        <Item.Content>
          <Item.Title>
            <span class="text-md line-clamp-1">{swipe.title}</span>
            <!--             <span class="text-xl">·</span> -->
            <!--             <span class="text- text-muted-foreground">{swipe.year}</span> -->
          </Item.Title>
          <!-- <Item.Description class="text-sm">{formatRelativeTime(swipe.swipedAt)}</Item.Description> -->
        </Item.Content>

      </Item.Root>
    {/each}
  </section>
</ScrollArea>
