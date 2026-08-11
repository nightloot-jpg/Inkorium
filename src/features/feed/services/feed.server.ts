import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '../../../lib/supabase.server'

export const getPostsFn = createServerFn({ method: 'GET' })
  .validator((data: { pageParam?: number }) => data)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const limit = 10
    const pageParam = data.pageParam ?? 0
    const from = pageParam * limit
    const to = from + limit - 1

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!inner(*),
        photos(*),
        comments(
          *,
          profiles(*)
        ),
        likes(*),
        post_shares(id)
      `)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      data: posts,
      nextPage: posts.length === limit ? pageParam + 1 : undefined,
    }
  })
