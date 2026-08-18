const fs = require('fs');
let code = fs.readFileSync('./src/main.tsx', 'utf8');

// Inside ProfileViewLegacy
// Add fetching for Song of the Day and Playlists
const profileEffectsSearch = `  useEffect(() => {
    async function loadData() {
      if (!targetUserId) return;
      setProfileNotFound(false);`;

const profileEffectsReplace = `  const playerState = usePlayerStore();
  const [songOfDay, setSongOfDay] = useState<any>(null);
  const [publicPlaylists, setPublicPlaylists] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!targetUserId) return;
      setProfileNotFound(false);
      
      // Load Song of the Day
      const { data: sod } = await supabase
        .from('profile_song_of_day')
        .select('*, music_tracks(*)')
        .eq('user_id', targetUserId)
        .maybeSingle();
      if (sod && sod.music_tracks) setSongOfDay(sod.music_tracks);
      
      // Load public playlists
      const { data: pls } = await supabase
        .from('music_playlists')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (pls) setPublicPlaylists(pls);`;

code = code.replace(profileEffectsSearch, profileEffectsReplace);

// Render Music tab inside profile
const profileTabsSearch = `<nav className="profile-tabs"><button className="active">Tablón</button><button>Información</button><button>Fotos (0)</button><button>Vídeos (0)</button><button>Amigos</button></nav>`;
const profileTabsReplace = `<nav className="profile-tabs"><button className="active">Tablón</button><button>Información</button><button>Fotos (0)</button><button>Vídeos (0)</button><button>Música</button><button>Amigos</button></nav>`;
code = code.replace(profileTabsSearch, profileTabsReplace);

// Insert a side section for Music in the profile if we have song of the day
const profileCardsSearch = `      {isOwnProfile ? (
        <Composer session={session} profile={profile} onPublish={(newPost) => setPosts(curr => [newPost, ...curr])} targetProfileId={session.user.id} />
      ) : (`;

const profileCardsReplace = `      {songOfDay && (
        <section className="panel profile-music-highlight" style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12}}>
          <div style={{width: 60, height: 60, flexShrink: 0, borderRadius: 4, overflow: 'hidden', backgroundColor: '#eee'}}>
            {songOfDay.cover_url || songOfDay.thumbnail ? (
              <img src={songOfDay.cover_url || songOfDay.thumbnail} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            ) : <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Music size={24} color="#888"/></div>}
          </div>
          <div style={{flex: 1}}>
            <strong style={{display: 'block', fontSize: '0.9em', color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: 2}}>🎵 Canción del día</strong>
            <div style={{fontWeight: 600}}>{songOfDay.title}</div>
            <div style={{fontSize: '0.9em', color: 'var(--text-light)'}}>{songOfDay.artist}</div>
          </div>
          <button className="primary-button" style={{padding: '6px 12px', fontSize: '0.9em'}} onClick={() => {
            playerState.playSong({
              source_type: songOfDay.source_type,
              video_id: songOfDay.youtube_id,
              audio_url: songOfDay.audio_url,
              title: songOfDay.title,
              artist: songOfDay.artist,
              thumbnail: songOfDay.cover_url
            });
          }}>▶ Escuchar</button>
        </section>
      )}
      {isOwnProfile ? (
        <Composer session={session} profile={profile} onPublish={(newPost) => setPosts(curr => [newPost, ...curr])} targetProfileId={session.user.id} />
      ) : (`;

code = code.replace(profileCardsSearch, profileCardsReplace);


fs.writeFileSync('./src/main.tsx', code);
console.log('Profile updated successfully');
