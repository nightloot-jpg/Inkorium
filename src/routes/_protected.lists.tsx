import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/lists')({
  component: () => <div className="p-4">Listas (Próximamente)</div>
})
