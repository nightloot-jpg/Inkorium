import { createFileRoute } from '@tanstack/react-router';
import { FeedPage } from '../features/feed/components/FeedPage';

export const Route=createFileRoute('/_protected/feed')({ssr:'data-only',component:FeedPage});
