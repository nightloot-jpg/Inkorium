import { useFeed } from '../hooks/useFeed';
import { FeedList } from './FeedList';
import { PostComposer } from './PostComposer';

export function FeedPage() {
  const { createPost } = useFeed();

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-4">
      <PostComposer
        isLoading={createPost.isPending}
        onSubmit={(content, type, photos) => createPost.mutate({ content, type, photos })}
      />
      <FeedList />
    </div>
  );
}
