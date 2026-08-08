import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/404')({
  component: () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold text-[#233B5D] mb-4">404</h1>
      <p className="text-xl text-slate-600 mb-8">Página no encontrada</p>
      <Link to="/" className="px-6 py-3 bg-[#233B5D] text-white rounded-lg font-medium hover:bg-[#1a2c45]">
        Volver al inicio
      </Link>
    </div>
  ),
});
