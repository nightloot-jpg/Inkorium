import { createFileRoute } from '@tanstack/react-router';
import { InklogList } from '../features/inklog/components';
import { Camera } from 'lucide-react';

export const Route = createFileRoute('/_protected/inklog')({
  component: InklogPage,
});

function InklogPage() {
  return (
    <div className="mx-auto max-w-[900px] space-y-6 pt-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-[#233B5D]">Inklog</h1>
          <p className="text-sm text-slate-500">Tu diario fotográfico</p>
        </div>
        <button className="flex items-center gap-2 rounded-md bg-[#233B5D] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a2c45]">
          <Camera size={18} /> Subir Foto
        </button>
      </div>

      <InklogList />
    </div>
  );
}
