import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/privacy')({
  component: () => <div>privacy page</div>,
});
