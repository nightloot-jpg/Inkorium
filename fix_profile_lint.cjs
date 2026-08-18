const fs = require('fs');
let code = fs.readFileSync('./src/main.tsx', 'utf8');

// ProfileViewLegacy doesn't have songOfDay and playerState state because the replace regex in update_profile.cjs 
// probably failed or matched something else, or I wrote it wrong.

const search = `  const isOwnProfile = !visitedUserId || visitedUserId === session.user.id;
  const targetUserId = isOwnProfile ? session.user.id : visitedUserId;
  const [viewCount, setViewCount] = useState<number | null>(null);`;

const replace = `  const isOwnProfile = !visitedUserId || visitedUserId === session.user.id;
  const targetUserId = isOwnProfile ? session.user.id : visitedUserId;
  const [viewCount, setViewCount] = useState<number | null>(null);

  const playerState = usePlayerStore();
  const [songOfDay, setSongOfDay] = useState<any>(null);
  const [publicPlaylists, setPublicPlaylists] = useState<any[]>([]);

  useEffect(() => {
    async function loadMusicData() {
      if (!targetUserId) return;
      const { data: sod } = await supabase.from('profile_song_of_day').select('*, music_tracks(*)').eq('user_id', targetUserId).maybeSingle();
      if (sod && sod.music_tracks) setSongOfDay(sod.music_tracks);
    }
    loadMusicData();
  }, [targetUserId]);
`;

code = code.replace(search, replace);
fs.writeFileSync('./src/main.tsx', code);
