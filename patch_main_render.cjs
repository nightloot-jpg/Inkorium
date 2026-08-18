const fs = require('fs');
let code = fs.readFileSync('./src/main.tsx', 'utf8');

// remove old MusicView component definition
code = code.replace(
  `function MusicView({ onPlay }: { onPlay: () => void }) { return <section className="content-view"><h1>Musica</h1><p className="view-subtitle">Escucha, descubre y comparte nuevos sonidos.</p><div className="music-list panel">{songs.map((song, index) => <div className="song-row" key={song}><span className="music-square">♫</span><div><strong>{song}</strong><small>Inkorium Music · pista {index + 1}</small></div><button onClick={onPlay}>▶ Escuchar</button></div>)}</div></section>; }`,
  ""
);

// update the app render
const renderSearch = `{page === "musica" && <MusicView onPlay={() => {}} />}`;
const renderReplace = `{page === "musica" && <MusicView session={session} navigate={navigate} />}`;
code = code.replace(renderSearch, renderReplace);

fs.writeFileSync('./src/main.tsx', code);
