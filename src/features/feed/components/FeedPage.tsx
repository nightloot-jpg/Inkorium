import { useFeedV2 } from '../hooks/useFeedV2';
import { FeedComposer } from './FeedComposer';
import { FeedListV2 } from './FeedListV2';

export function FeedPage() {
  const { createPost } = useFeedV2();
  return <div className="feed-page"><FeedComposer loading={createPost.isPending} onSubmit={(content, type, photos) => createPost.mutate({ content, type, photos })} /><FeedListV2 /></div>;
}
