import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/games')({
  component: () => <div className="p-4">Juegos (Próximamente)</div>
})
