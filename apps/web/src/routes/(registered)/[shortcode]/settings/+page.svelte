<script lang="ts">
  import { getLoungeContext, deleteLounge } from '$lib/loungeService.svelte.js'
  import { getUserContext } from '$lib/userService.svelte.js'
  import { Badge } from '$lib/components/ui/badge'
  import * as Card from '$lib/components/ui/card'
  import SubpageHeader from '$lib/components/layout/subpage-header/subpage-header.svelte'
  import LoungeFilters from '$lib/components/settings/lounge-filters/lounge-filters.svelte'
  import LoungeDeletePrompt from '$lib/components/settings/lounge-delete-prompt/lounge-delete-prompt.svelte'

  const ls = getLoungeContext()
  const us = getUserContext()

</script>

<div class="mx-auto mb-12 flex w-full max-w-xl flex-col items-center gap-6 p-4">
  <SubpageHeader title="Lounge Settings"/>

  <Card.Root class="w-full">
    <Card.Header>
      <Card.Title>
        Shortcode
      </Card.Title>
      <Card.Description>
        A temporary unique identifier for easy joining.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <Badge variant="secondary" class="font-mono text-md tabular-nums">{ls.lounge.shortcode}</Badge>
    </Card.Content>
  </Card.Root>

  <LoungeFilters settings={ls.lounge.settings}/>

  {#if us.user.id === ls.lounge.creatorId }
    <LoungeDeletePrompt loungeId={ls.lounge.id}/>
  {/if}
</div>

