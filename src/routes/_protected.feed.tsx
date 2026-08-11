import { createFileRoute } from '@tanstack/react-router';
import { PostComposer, FeedList } from '../features/feed/components';
import { useFeed } from '../features/feed/hooks/useFeed';

export const Route = createFileRoute('/_protected/feed')({
  ssr: 'data-only',
  component: Feed,
});

function Feed() {
  const { createPost } = useFeed();

  return (
    <div className="mx-auto w-full max-w-[820px] space-y-4">
      <PostComposer
        onSubmit={(content, type, photos) => createPost.mutate({ content, type, photos })}
        isLoading={createPost.isPending}
      />
      <FeedList />
    </div>
  );
}
