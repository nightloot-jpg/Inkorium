import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/events')({
  component: () => <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">events page</div>,
});
