import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/help')({
  component: () => <div>help page</div>,
});
