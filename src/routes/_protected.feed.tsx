import { createFileRoute } from '@tanstack/react-router';
import { PostComposer, FeedList } from '../features/feed/components';
import { useFeed } from '../features/feed/hooks/useFeed';

export const Route = createFileRoute('/_protected/feed')({
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
