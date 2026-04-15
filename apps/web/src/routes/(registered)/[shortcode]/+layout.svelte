<script lang="ts">
  import { untrack } from 'svelte'
  import { LoungeService, setLoungeContext } from '$lib/loungeService.svelte'

  let { children, data } = $props()

  const ls = setLoungeContext(untrack(() => new LoungeService(data.lounge)))
  // Clean up web socket connections on navigating away
  $effect(() => {
    return () => ls.destroy()
  })
</script>

{@render children()}