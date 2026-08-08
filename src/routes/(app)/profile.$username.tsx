import { createFileRoute } from '@tanstack/react-router';
import { useProfile } from '@/features/profile/hooks/useProfile';

export const Route = createFileRoute('/(app)/profile/$username')({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const { data: profile, isLoading } = useProfile(username);
  const profileData = profile as { username: string } | undefined;

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="mt-8 p-6 text-center bg-white rounded-xl shadow-sm border border-slate-200">
        {isLoading ? 'Cargando perfil...' : `Perfil de ${profileData?.username}`}
      </div>
    </div>
  );
}
