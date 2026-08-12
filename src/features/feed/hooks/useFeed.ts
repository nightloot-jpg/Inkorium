import { useEffect, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '../../../lib/realtime/useRealtime';
import { feedService } from '../services/feed.service';

const FEED_KEY=['feed'] as const;
export function useFeed(){
 const client=useQueryClient(); const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 const refresh=()=>client.invalidateQueries({queryKey:FEED_KEY});
 useRealtime({table:'posts',onEvent:refresh}); useRealtime({table:'comments',onEvent:refresh}); useRealtime({table:'likes',onEvent:refresh});
 const feed=useInfiniteQuery({queryKey:FEED_KEY,queryFn:({pageParam})=>feedService.getPosts({pageParam}),initialPageParam:0,enabled:mounted,staleTime:15000,retry:1,getNextPageParam:last=>last.nextPage});
 const createPost=useMutation({mutationFn:feedService.createPost,onSuccess:refresh});
 const likePost=useMutation({mutationFn:feedService.likePost,onSuccess:refresh});
 const unlikePost=useMutation({mutationFn:feedService.unlikePost,onSuccess:refresh});
 const addComment=useMutation({mutationFn:feedService.addComment,onSuccess:refresh});
 const deletePost=useMutation({mutationFn:feedService.deletePost,onSuccess:refresh});
 const editPost=useMutation({mutationFn:feedService.editPost,onSuccess:refresh});
 return {...feed,createPost,likePost,unlikePost,addComment,deletePost,editPost};
}
