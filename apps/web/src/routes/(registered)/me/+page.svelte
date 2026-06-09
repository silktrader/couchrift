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
  import SubpageHeader from '$lib/components/layout/subpage-header/subpage-header.svelte'

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

<div class="flex flex-col gap-4 m-4 flex-1">
  <SubpageHeader/>

  <section class="flex flex-col items-center m-8">

    <div class="relative inline-block">
      <Avatar.Root class="size-30 ring-2 ring-foreground">
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
                    variant="default"
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
              <DropdownMenu.Item disabled={!canRemoveAvatar}
                                 onclick={() => console.log('removing')}
                                 variant="destructive"
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
  </section>

  <section class="flex flex-col items-center gap-2">
    <h2 class="text-lg font-semibold">{user.name}</h2>
    <h4 class="text-sm text-muted-foreground">{user.email}</h4>
  </section>

  <section class="flex flex-1 flex-col gap-4 items-center">
    <Button variant="default" class="w-2/3" size="lg">Edit Profile</Button>
    <Button variant="secondary" class="w-2/3" size="lg" onclick={signOut}>Logout</Button>
  </section>

  <section class="flex flex-row gap-4 justify-center text-muted-foreground">
    <Button
        variant="ghost"
        size="icon-lg"
        href="https://github.com/silktrader/couch-rift"
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub Repository"
    >
      <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
      >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
        <path d="M9 18c-4.51 2-5-2-7-2"/>
      </svg>
    </Button>
  </section>
</div>