import { createFileRoute } from '@tanstack/react-router';
import { FeedPage } from '../features/feed/components';

export const Route = createFileRoute('/_protected/feed')({
  ssr: false,
  component: FeedPage,
});
