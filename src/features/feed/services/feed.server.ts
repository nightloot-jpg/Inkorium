import { getSupabaseServerClient } from '../../../lib/supabase.server'

async function requireUser() {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) throw new Error('Not authenticated')

  return { supabase, user: data.user }
}

export async function getPosts(pageParam = 0) {
  const supabase = getSupabaseServerClient()
  const limit = 10
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
}

export async function createPost(data: FormData) {
  const { supabase, user } = await requireUser()
  const content = data.get('content')?.toString() ?? ''
  const type = data.get('type')?.toString() ?? 'text'
  const photos = data.getAll('photos').filter((value): value is File => value instanceof File)

  const { data: post, error } = await supabase
    .from('posts')
    .insert({ user_id: user.id, content, type } as any)
    .select()
    .single()

  if (error) throw error

  for (const photo of photos) {
    const fileExt = photo.name.split('.').pop() || 'jpg'
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`
    const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, photo)

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage.from('photos').getPublicUrl(filePath)
    const { error: photoError } = await supabase.from('photos').insert({
      user_id: user.id,
      post_id: (post as any).id,
      url: publicUrlData.publicUrl,
    } as any)

    if (photoError) throw photoError
  }

  return post
}

export async function likePost(postId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: postId } as any)
  if (error) throw error
}

export async function unlikePost(postId: string) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', user.id)
    .eq('post_id', postId)
  if (error) throw error
}

export async function addComment(data: { postId: string; content: string; parentId?: string }) {
  const { supabase, user } = await requireUser()
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      user_id: user.id,
      post_id: data.postId,
      content: data.content,
      parent_id: data.parentId || null,
    } as any)
    .select('*, profiles(*)')
    .single()

  if (error) throw error
  return comment
}

export async function deletePost(postId: string) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}

export async function editPost(data: { postId: string; content: string }) {
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from('posts')
    .update({ content: data.content, updated_at: new Date().toISOString() } as never)
    .eq('id', data.postId)
  if (error) throw error
}
