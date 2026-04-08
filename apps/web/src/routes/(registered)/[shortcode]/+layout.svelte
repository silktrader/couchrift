<script lang="ts">
  import { untrack } from 'svelte'
  import { LoungeService, setLoungeContext } from '$lib/loungeService.svelte'

  let { children, data } = $props()

  const ls = setLoungeContext(untrack(() => new LoungeService(data.lounge)))
</script>

{@render children()}