import { createFileRoute } from '@tanstack/react-router';
import { PhotosPage } from '../features/photos/components';

export const Route = createFileRoute('/_protected/photos')({
  ssr: 'data-only',
  component: PhotosPage,
});
