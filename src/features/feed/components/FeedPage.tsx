import { FeedList } from './FeedList';
import { PostComposer } from './PostComposer';
import { useFeed } from '../hooks/useFeed';

export function FeedPage() {
  const { createPost } = useFeed();

  return (
    <div className="feed-page">
      <PostComposer
        isLoading={createPost.isPending}
        onSubmit={(content) => createPost.mutate({ content, kind: 'text' })}
      />
      <FeedList />
    </div>
  );
}
