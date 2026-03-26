<script lang="ts">

  let testValue = $state('')

  $effect(() => {
    fetch(`/`, { }).then((res) => testValue = res.statusText)
  })

</script>

<h1>Here's the result of the first API call: {testValue}</h1>
