import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/profile/$username')({
  component: () => <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">profile.$username page</div>,
});
