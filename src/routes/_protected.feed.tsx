import { createFileRoute } from '@tanstack/react-router';
import { PostComposer, FeedList } from '../features/feed/components';
import { useFeed } from '../features/feed/hooks/useFeed';

export const Route = createFileRoute('/_protected/feed')({
  // The feed is a dynamic, authenticated client surface. Keep the protected
  // parent route SSR/auth guard, but do not render this route component into
  // the initial server HTML. This removes the Feed tree from the SSR/client
  // hydration comparison while preserving the normal client navigation flow.
  ssr: 'data-only',
  component: Feed,
});

function Feed() {
  const { createPost } = useFeed();

  const handleCreatePost = (content: string, type: string, photos: File[]) => {
    createPost.mutate({ content, type, photos });
  };

  return (
    <div className="mx-auto max-w-[770px] space-y-4 pt-4">
      <PostComposer onSubmit={handleCreatePost} isLoading={createPost.isPending} />
      <FeedList />
    </div>
  );
}
