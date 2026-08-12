import { FeedList } from './FeedList';
import { PostComposer } from './PostComposer';
import { useFeed } from '../hooks/useFeed';
export function FeedPage(){const {createPost}=useFeed();return <div className="space-y-4"><PostComposer submitting={createPost.isPending} onSubmit={(content,type,photos)=>createPost.mutate({content,type,photos})}/><FeedList/></div>}
