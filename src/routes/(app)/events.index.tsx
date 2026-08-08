import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/(app)/events/')({ component: () => <div className="p-4 bg-white rounded-xl shadow-sm">Eventos</div> });
