<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import * as Avatar from '$lib/components/ui/avatar'
  import * as Card from '$lib/components/ui/card'
  import * as Form from '$lib/components/ui/form'
  import Camera from '@lucide/svelte/icons/camera'
  import { goto } from '$app/navigation'
  import * as ImageCropper from '$lib/components/ui/image-cropper'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import EditIcon from '@lucide/svelte/icons/edit'
  import ImagePlus from '@lucide/svelte/icons/image-plus'
  import Pencil from '@lucide/svelte/icons/pencil'
  import Check from '@lucide/svelte/icons/check'
  import { getFileFromUrl } from '$lib/components/ui/image-cropper'
  import { fade } from 'svelte/transition'
  import { Spinner } from '$lib/components/ui/spinner'
  import { getUserContext } from '$lib/userService.svelte'
  import { authClient } from '$lib/auth-client'

  const userService = getUserContext()

  let user = $derived(userService.user)
  let avatarUrl = $derived(user.image ? `/uploads/avatars/${user.image}` : null)
  let canRemoveAvatar = $derived(user.image != null)
  let avatarState: 'ready' | 'saving' | 'saved' = $state('ready')
  let completedTimer: ReturnType<typeof setTimeout> | null = null

  async function signOut(): Promise<void> {
    await authClient.signOut()
    await goto('/')
  }

  // Upload the image to the server, on success update the authentication details, reflected by the reactive store
  async function uploadAvatar(file: File) {
    avatarState = 'saving'
    const result = await userService.uploadAvatar(file)

    if (result.type === 'success') {
      avatarState = 'saved'
      if (completedTimer) clearTimeout(completedTimer)
      completedTimer = setTimeout(() => {
        avatarState = 'ready'
        completedTimer = null
      }, 2500)
      return
    } else {
      avatarState = 'ready'
    }
  }
</script>

<section class="mt-4 flex w-full flex-1 flex-col items-center gap-12">
  <div class="relative inline-block">
    <Avatar.Root class="size-30">
      <Avatar.Image src={avatarUrl} alt="User avatar"/>
      <Avatar.Fallback class="text-2xl font-bold">{user.name[0]}.</Avatar.Fallback>
    </Avatar.Root>
    <ImageCropper.Root
        onUnsupportedFile={(file) => {
        alert(`Unsupported file type: ${file.type}`)
      }}
        onCropped={async (url) => {
        const file = await getFileFromUrl(url)
        await uploadAvatar(file)
      }}
    >
      <div class="relative">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({props})}
              <Button
                  {...props}
                  class="absolute -right-3 -bottom-1 z-10 rounded-full disabled:opacity-100"
                  variant="secondary"
                  size="icon-lg"
                  disabled={avatarState !== 'ready'}
              >
                {#if avatarState === 'saved'}
                  <span in:fade={{ duration: 600 }}>
                    <Check class="size-5 text-green-400"/>
                  </span>
                {:else if avatarState === 'saving'}
                  <Spinner class="size-5"/>
                {:else}
                  <ImagePlus class="size-5"/>
                {/if}
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="start">
            <ImageCropper.UploadTrigger>
              <DropdownMenu.Item>Change Avatar</DropdownMenu.Item>
            </ImageCropper.UploadTrigger>
            <DropdownMenu.Item disabled={!canRemoveAvatar} onclick={() => console.log('removing')} variant="destructive"
            >Remove Avatar
            </DropdownMenu.Item
            >
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
      <ImageCropper.Dialog>
        <ImageCropper.Cropper/>
        <ImageCropper.Controls>
          <ImageCropper.Cancel/>
          <ImageCropper.Crop/>
        </ImageCropper.Controls>
      </ImageCropper.Dialog>
    </ImageCropper.Root>
  </div>

  <section class="flex flex-col items-center gap-2">
    <h2 class="text-lg font-semibold">{user.name}</h2>
    <h4 class="text-sm text-muted-foreground">{user.email}</h4>
  </section>
</section>

<section class="flex flex-1 flex-col gap-4">
  <Button variant="default" size="lg">Edit Profile</Button>
  <Button variant="secondary" size="lg" onclick={signOut}>Logout</Button>
</section>

<section class="flex flex-row gap-4 text-sm text-muted-foreground">
  <span>Privacy Policy</span>
  <span>•</span>
  <span>Terms of Service</span>
</section>
