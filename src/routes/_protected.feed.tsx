import { createFileRoute } from '@tanstack/react-router';
import { FeedList } from '../features/feed/components/FeedList';
import { PostComposer } from '../features/feed/components/PostComposer';
import { useFeed } from '../features/feed/hooks/useFeed';

export const Route = createFileRoute('/_protected/feed')({
  ssr: 'data-only',
  component: FeedRoute,
});

function FeedRoute() {
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
