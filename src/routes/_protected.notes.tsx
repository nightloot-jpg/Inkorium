import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/notes')({
  component: () => <div className="p-4">Notas (Próximamente)</div>
})
