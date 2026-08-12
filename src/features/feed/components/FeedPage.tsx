import { useFeed } from '../hooks/useFeed';
import { FeedComposer } from './FeedComposer';
import { FeedList } from './FeedList';

export function FeedPage() {
  const { createPost } = useFeed();

  return (
    <div className="feed-page">
      <FeedComposer
        loading={createPost.isPending}
        onSubmit={(content, type, photos) => createPost.mutate({ content, type, photos })}
      />
      <FeedList />
    </div>
  );
}
