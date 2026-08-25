export type ProfileTab = 'Inicio' | 'Fotos' | 'Videos' | 'Música';

type Props = {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
};

const TABS: ProfileTab[] = ['Inicio', 'Fotos', 'Videos', 'Música'];

export function ProfileTabs({ activeTab, onChange }: Props) {
  return (
    <div className="profile-view-tabs" role="tablist" aria-label="Secciones del perfil">
      {TABS.map(tab => (
        <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} onClick={() => onChange(tab)}>
          {tab}
        </button>
      ))}
    </div>
  );
}
