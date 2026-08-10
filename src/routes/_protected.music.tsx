import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/music')({
  component: () => <div className="p-4">Música (Próximamente)</div>
})
