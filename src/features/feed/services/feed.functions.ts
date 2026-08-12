import { createServerFn } from '@tanstack/react-start';
import { getSupabaseServerClient } from '../../../lib/supabase.server';
import type { CreateFeedPostInput, FeedPost } from '../types';

export const getFeedFn=createServerFn({method:'GET'}).handler(async():Promise<FeedPost[]>=>{
 const supabase=getSupabaseServerClient();
 const {data:auth}=await supabase.auth.getUser();
 if(!auth.user)throw new Error('Not authenticated');
 const {data:posts,error}=await supabase.from('posts').select('id,user_id,content,type,created_at,profiles(full_name,avatar_url),photos(url),likes(user_id),comments(id),post_shares(id)').order('created_at',{ascending:false}).limit(20);
 if(error)throw new Error(`Feed query failed: ${error.message}`);
 return (posts??[]).map((post:any):FeedPost=>({
  id:post.id,userId:post.user_id,authorName:post.profiles?.full_name||'Usuario',authorAvatar:post.profiles?.avatar_url||`https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.full_name||'Usuario')}&background=e8eef7&color=164b88`,createdAt:post.created_at,content:post.content||'',kind:post.type==='music'?'music':post.type==='photo'?'photo':'text',title:post.content?.split('\n')[0]||undefined,subtitle:post.type==='music'?'MHR MUSIC':undefined,duration:post.type==='music'?'5:05':undefined,image:post.photos?.[0]?.url||undefined,likes:post.likes?.length||0,liked:post.likes?.some((like:any)=>like.user_id===auth.user.id)||false,comments:post.comments?.length||0,shares:post.post_shares?.length||0,
 }));
});

export const createFeedPostFn=createServerFn({method:'POST'}).validator((data:CreateFeedPostInput)=>data).handler(async({data})=>{
 const content=data.content.trim(); if(!content)throw new Error('La publicación está vacía');
 const supabase=getSupabaseServerClient(); const {data:auth}=await supabase.auth.getUser(); if(!auth.user)throw new Error('Not authenticated');
 const {data:post,error}=await supabase.from('posts').insert({user_id:auth.user.id,content,type:data.kind}).select('id,user_id,content,type,created_at').single();
 if(error)throw new Error(`Create post failed: ${error.message}`); return post;
});
