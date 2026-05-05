<script lang="ts">
  import type { FilmPerson } from '@couchrift/shared/schemas/tmdbFilm'

  let { actor }: { actor: FilmPerson } = $props()

</script>

<div class="flex flex-col items-center gap-2">
  <div class="w-full aspect-2/3">
    {#if actor.image}
      <img class="border rounded-2xl w-full h-full object-cover"
           src={`https://image.tmdb.org/t/p/w185/${actor.image}`}
           alt="Profile"/>
    {:else}
      <div class="bg-secondary border rounded-2xl w-full h-full">
      </div>
    {/if}
  </div>
  <h4 class="w-full line-clamp-2 text-ellipsis wrap-break-word text-center leading-tight text-sm">{actor.name}</h4>
</div>
