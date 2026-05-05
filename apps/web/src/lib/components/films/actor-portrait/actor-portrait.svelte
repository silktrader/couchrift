<script lang="ts">
  import type { FilmPerson } from '@couchrift/shared/schemas/tmdbFilm'

  let { actor }: { actor: FilmPerson } = $props()

</script>

<div>

  <div class="flex flex-col items-center gap-2">
    <img class="border rounded-2xl" src={`https://image.tmdb.org/t/p/w185/${actor.image}`} alt="Profile"/>
    <h4 class="line-clamp-2 text-center">{actor.name}</h4>
  </div>

</div>