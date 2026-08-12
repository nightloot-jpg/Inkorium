import { useFeed } from '../hooks/useFeed';
import { FeedList } from './FeedList';
import { PostComposer } from './PostComposer';

export function FeedPage() {
  const { createPost } = useFeed();
  return (
    <div className="feed-page" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <PostComposer isLoading={createPost.isPending} onSubmit={(content, type, photos) => createPost.mutate({ content, type, photos })} />
      <FeedList />
    </div>
  );
}
