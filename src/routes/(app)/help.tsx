import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/(app)/help')({ component: () => <div className="p-4 bg-white rounded-xl shadow-sm">Help</div> });
