import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/(app)/photos')({ component: () => <div className="p-4 bg-white rounded-xl shadow-sm">Photos</div> });
