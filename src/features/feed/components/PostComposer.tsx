import { useRef, useState } from 'react';
import { BarChart3, Camera, FileText, Globe2, MoreHorizontal, Music2, Video, Loader2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export function PostComposer({ isLoading, onSubmit }: { isLoading: boolean; onSubmit: (content: string) => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const name = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.username || 'Usuario';
  const avatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e8eef7&color=164b88`;

  const publish = () => {
    const value = content.trim();
    if (!value || isLoading) return;
    onSubmit(value);
    setContent('');
  };

  return (
    <section className="feed-card">
      <div className="feed-composer-top">
        <img src={avatar} alt="" className="feed-avatar" />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={2}
          placeholder={`¿Qué estás pensando, ${name}?`}
          className="feed-composer-input"
        />
      </div>
      <div className="feed-composer-actions">
        <button type="button" className="feed-action"><FileText size={18} />Estado</button>
        <button type="button" className="feed-action" onClick={() => inputRef.current?.click()}><Camera size={18} />Foto</button>
        <button type="button" className="feed-action"><Video size={18} />Vídeo</button>
        <button type="button" className="feed-action"><Music2 size={18} />Música</button>
        <button type="button" className="feed-action"><BarChart3 size={18} />Encuesta</button>
        <button type="button" className="feed-action"><FileText size={18} />Noticia</button>
        <button type="button" className="feed-action"><MoreHorizontal size={18} />Más</button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" />
      <div className="feed-composer-bottom">
        <button type="button" className="feed-action"><Globe2 size={17} />Público <MoreHorizontal size={14} /></button>
        <button type="button" className="feed-publish" disabled={isLoading || !content.trim()} onClick={publish}>
          {isLoading ? <Loader2 className="mx-auto animate-spin" size={18} /> : 'Publicar'}
        </button>
      </div>
    </section>
  );
}
