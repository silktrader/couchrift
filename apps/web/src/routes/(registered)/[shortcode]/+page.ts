// import { apiGet } from '$lib/apiFetch'
// import type { PageLoad } from './$types'
// import type { LoungeResponse } from '@couchrift/shared/schemas/lounge'
//
// export const load: PageLoad = async () => {
//
//   const response = await apiGet<{ lounges: LoungeResponse[] }>(`me/lounges/active`)
//   if (response.type === 'success')
//     return { lounges: response.data.lounges }
//
//   return { lounges: [] }
// }