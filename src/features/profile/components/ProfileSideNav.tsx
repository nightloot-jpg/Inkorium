import { Camera, Home, Images, Music2, Video } from 'lucide-react';
import type { ProfileTab } from './ProfileTabs';

type Props = {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
};

const ITEMS: Array<{ tab: ProfileTab; label: string; icon: typeof Home }> = [
  { tab: 'Inicio', label: 'Inicio', icon: Home },
  { tab: 'Fotos', label: 'Fotos', icon: Images },
  { tab: 'Videos', label: 'Vídeos', icon: Video },
  { tab: 'Música', label: 'Música', icon: Music2 },
];

export function ProfileSideNav({ activeTab, onChange }: Props) {
  return (
    <aside className="profile-side-nav" aria-label="Navegación del perfil">
      <div className="profile-side-nav-title"><Camera size={16} /> Perfil</div>
      <nav>
        {ITEMS.map(({ tab, label, icon: Icon }) => (
          <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} onClick={() => onChange(tab)} aria-current={activeTab === tab ? 'page' : undefined}>
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
