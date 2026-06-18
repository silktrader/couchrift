<script lang="ts">
  import * as Item from '$lib/components/ui/item'
  import { ContactRound, X } from '@lucide/svelte/icons'
  import { formatRelativeTime } from '$lib/dates'
  import * as Avatar from '$lib/components/ui/avatar'
  import { Button } from '$lib/components/ui/button'
  import { ScrollArea } from '$lib/components/ui/scroll-area'
  import { getLoungeContext } from '$lib/loungeService.svelte'

  const ls = getLoungeContext()

</script>

<ScrollArea class="h-full w-full">
  <section class="flex flex-col gap-2 items-center pr-4">

    {#each ls.lounge.participants as participant (participant.id)}
      <Item.Root variant="outline">
        <Item.Media>
          <Avatar.Root class="size-12 ring-2">
            <Avatar.Image src={`/avatars/${participant.image}`} alt="Avatar"/>
            <Avatar.Fallback class="capitalize">{participant.name[0]}.</Avatar.Fallback>
          </Avatar.Root>
        </Item.Media>
        <Item.Content>
          <Item.Title class="text-lg">{participant.name}</Item.Title>
        </Item.Content>
        <Item.Actions>
          <Button
              size="icon"
              variant="outline"
              class="rounded-full"
              aria-label="Befriend"
              disabled
          >
            <ContactRound/>
          </Button>
        </Item.Actions>
      </Item.Root>
    {/each}
  </section>
</ScrollArea>
