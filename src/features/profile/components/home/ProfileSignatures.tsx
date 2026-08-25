import { BookOpen, Send } from 'lucide-react';
import type { Signature } from '../../types/profile.types';

type Props = {
  signatures: Signature[];
  loading: boolean;
  draft: string;
  saving: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
};

export function ProfileSignatures({ signatures, loading, draft, saving, onDraftChange, onSubmit }: Props) {
  return (
    <div className="profile-view-card profile-view-signature-card">
      <div className="profile-view-section-head"><h2><BookOpen size={17} /> Libro de firmas</h2><span>{signatures.length}</span></div>
      <div className="profile-view-signature-form">
        <textarea value={draft} onChange={event => onDraftChange(event.target.value)} placeholder="Deja una firma en este perfil..." />
        <div className="profile-view-signature-actions"><span>Máx. 500 caracteres</span><button type="button" onClick={onSubmit} disabled={!draft.trim() || saving}><Send size={14} />Firmar</button></div>
      </div>
      {loading ? <div className="profile-view-empty">Cargando firmas...</div> : signatures.length === 0 ? <div className="profile-view-empty">Todavía no hay firmas. Sé la primera persona en dejar un mensaje.</div> : (
        <div className="profile-view-signatures">
          {signatures.map(signature => <article key={signature.id} className="profile-view-signature"><div>{signature.author?.avatar_url ? <img className="profile-view-signature-avatar" src={signature.author.avatar_url} alt="" /> : <div className="profile-view-signature-avatar">{(signature.author?.full_name || signature.author?.username || 'U').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</div>}</div><div><div className="profile-view-signature-meta">{signature.author?.full_name || signature.author?.username || 'Usuario'} · {new Date(signature.created_at).toLocaleDateString()}</div><p>{signature.content}</p></div></article>)}
        </div>
      )}
    </div>
  );
}
