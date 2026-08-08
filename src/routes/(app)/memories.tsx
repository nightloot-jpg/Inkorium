import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/(app)/memories')({ component: () => <div className="p-4 bg-white rounded-xl shadow-sm">Recuerdos</div> });
