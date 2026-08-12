import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFeedPostFn, getFeedFn } from '../services/feed.functions';
import type { CreateFeedPostInput, FeedPost } from '../types';

const FEED_KEY=['inkorium-feed'] as const;
export function useFeed(){
 const client=useQueryClient(); const [mounted,setMounted]=useState(false); useEffect(()=>setMounted(true),[]);
 const feed=useQuery<FeedPost[]>({queryKey:FEED_KEY,enabled:mounted,staleTime:15000,retry:1,queryFn:()=>getFeedFn()});
 const createPost=useMutation({mutationFn:(input:CreateFeedPostInput)=>createFeedPostFn({data:input}),onSuccess:()=>client.invalidateQueries({queryKey:FEED_KEY})});
 const toggleLike=(postId:string)=>client.setQueryData<FeedPost[]>(FEED_KEY,posts=>posts?.map(post=>post.id===postId?{...post,liked:!post.liked,likes:post.likes+(post.liked?-1:1)}:post));
 return {...feed,createPost,toggleLike};
}
