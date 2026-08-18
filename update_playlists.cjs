const fs = require('fs');
let code = fs.readFileSync('./src/features/music/MusicView.tsx', 'utf8');

const plSearch = `function PlaylistsTab({ session }: { session: any }) {
  return (
    <div className="panel" style={{padding: 20}}>
      <h3 style={{marginTop: 0}}>Mis Playlists</h3>
      <p style={{color: '#666'}}>Función de playlists en desarrollo.</p>
    </div>
  );
}`;

const plReplace = `function PlaylistsTab({ session }: { session: any }) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  async function load() {
    const { data } = await supabase
      .from('music_playlists')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if(data) setPlaylists(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [session.user.id]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if(!name.trim()) return;
    setCreating(true);
    await supabase.from('music_playlists').insert({
      user_id: session.user.id,
      name: name.trim(),
      is_public: true
    });
    setName("");
    setCreating(false);
    load();
  }

  if(loading) return <div style={{textAlign: 'center', padding: 40}}><Loader2 className="spin" /></div>;

  return (
    <div className="panel" style={{padding: 20}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
        <h3 style={{marginTop: 0, marginBottom: 0}}>Mis Playlists</h3>
      </div>
      
      <form onSubmit={handleCreate} style={{display: 'flex', gap: 10, marginBottom: 20}}>
        <input 
          type="text" 
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre de la nueva playlist..."
          style={{flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 4}}
        />
        <button type="submit" className="primary-button" disabled={creating || !name.trim()}>
          {creating ? 'Creando...' : 'Crear'}
        </button>
      </form>

      {playlists.length === 0 ? (
        <p style={{color: '#666'}}>No tienes playlists creadas todavía.</p>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
          {playlists.map(pl => (
            <div key={pl.id} style={{display: 'flex', alignItems: 'center', gap: 15, padding: 10, border: '1px solid #eee', borderRadius: 4, cursor: 'pointer'}} onClick={() => {
              // TODO: Navigate to playlist details
            }}>
              <div style={{width: 50, height: 50, background: '#e0e0e0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {pl.cover_url ? <img src={pl.cover_url} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4}}/> : <ListPlus size={20} color="#666"/>}
              </div>
              <div style={{flex: 1}}>
                <strong style={{display: 'block'}}>{pl.name}</strong>
                <span style={{fontSize: '0.85em', color: '#666'}}>{pl.is_public ? 'Pública' : 'Privada'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}`;

code = code.replace(plSearch, plReplace);
fs.writeFileSync('./src/features/music/MusicView.tsx', code);
