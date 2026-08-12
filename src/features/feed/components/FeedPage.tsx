import { useFeed } from '../hooks/useFeed';
import { FeedList } from './FeedList';
import { PostComposer } from './PostComposer';

export function FeedPage() {
  const { createPost } = useFeed();
  return <div style={{display:'grid',gap:16,width:'100%',minWidth:0}}><PostComposer isLoading={createPost.isPending} onSubmit={(content,type,photos)=>createPost.mutate({content,type,photos})}/><FeedList/></div>;
}
