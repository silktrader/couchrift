<script lang="ts">
  import './layout.css'
  import favicon from '$lib/assets/favicon.svg'

  let { children } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon}/>
</svelte:head>
<div class="grid place-items-center h-svh w-full py-2 md:py-10">
  {@render children()}
</div>