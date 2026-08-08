import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(app)/profile/')({
  component: () => <div className="max-w-4xl mx-auto w-full bg-white p-6 rounded-xl">Mi Perfil</div>,
});
