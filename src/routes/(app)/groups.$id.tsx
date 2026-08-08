import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/(app)/groups/$id')({ component: () => <div className="p-4 bg-white rounded-xl shadow-sm">Group Detail</div> });
