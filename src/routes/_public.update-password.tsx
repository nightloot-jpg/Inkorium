import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/update-password')({
  component: () => <div>update-password page</div>,
});
