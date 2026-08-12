import { useFeed } from '../hooks/useFeed';
import { FeedList } from './FeedList';
import { PostComposer } from './PostComposer';

export function FeedPage() {
  const { createPost } = useFeed();

  return (
    <div className="feed-page" style={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PostComposer
        isLoading={createPost.isPending}
        onSubmit={(content, type, photos) => createPost.mutate({ content, type, photos })}
      />
      <FeedList />
    </div>
  );
}
