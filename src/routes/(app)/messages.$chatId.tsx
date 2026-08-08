import { createFileRoute } from '@tanstack/react-router';
export const Route = createFileRoute('/(app)/messages/$chatId')({ component: () => <div className="p-4 bg-white rounded-xl shadow-sm">Chat Message</div> });
