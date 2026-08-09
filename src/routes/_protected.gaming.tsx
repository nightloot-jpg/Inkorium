import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/gaming')({
  component: () => <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">gaming page</div>,
});
