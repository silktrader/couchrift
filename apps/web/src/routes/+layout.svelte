<script lang="ts">
  import './layout.css'
  import favicon from '$lib/assets/favicon.svg'

  let { children } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon}/>
</svelte:head>

<div class="min-h-svh w-full md:flex md:justify-center md:pt-[15vh] md:pb-[15vh]">
  <main
      class="
        flex flex-col w-full p-4
        min-h-svh
        outline-1
        md:max-w-lg
        md:min-h-[60vh]
        md:rounded-3xl
        md:border-2
      md:border-neutral-900
    "
  >
    {@render children()}
  </main>
</div>