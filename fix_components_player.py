import re

with open('src/components_player.tsx', 'r') as f:
    content = f.read()

# Fix the broken return statement replacement. The previous script messed up due to backslashes/quotes.

# Load the backup or reset to HEAD to do it cleanly
import subprocess
subprocess.run(['git', 'checkout', 'src/components_player.tsx'])

with open('src/components_player.tsx', 'r') as f:
    content = f.read()

if 'GripVertical' not in content:
    content = content.replace('ListMusic } from', 'ListMusic, GripVertical, Music } from')

# Find the start of the return statement
start_idx = content.find('return (')
if start_idx == -1:
    print("Could not find 'return ('")
    exit(1)

# we want to replace from 'return (' to the end of the FloatingMusicPlayer function,
# which is right before the last closing brace in that file or right before the next export/function.
# Looking at the file, FloatingMusicPlayer is the main function.
# We can just use the provided new return statement and replace it cleanly using regex.

pattern = re.compile(r'return\s*\(\s*<>\s*\{\/\* The YouTube iframe container.*?\);\s*\}', re.DOTALL)

new_return = """return (
    <>
      {/* The YouTube iframe container must be entirely static in the DOM to avoid re-creation */}
      <div id="youtube-player-container" style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '1px', height: '1px' }}></div>

      {playerState.isOpen && (
        <DraggablePlayerContainer isExpanded={playerState.isExpanded}>
          {!playerState.currentSong ? (
             <div className="player-empty-state">
                <div className="drag-handle"><GripVertical size={16} /></div>
                <div className="empty-content">
                  <Music size={24} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <span>No hay ninguna canción</span>
                  <small>Selecciona una canción</small>
                </div>
                <button onClick={() => playerState.closePlayer()} className="icon-btn no-drag close-btn" aria-label="Cerrar">
                  <X size={20} />
                </button>
             </div>
          ) : playerState.isExpanded ? (
            <div className="music-player-expanded">
              <div className="drag-handle-expanded">
                <GripVertical size={20} />
              </div>
              <div className="player-expanded-header">
                <button onClick={() => playerState.minimizePlayer()} className="icon-btn no-drag" aria-label="Minimizar">
                  <Minimize2 size={24} />
                </button>
                <div className="tabs no-drag">
                    <button className={!showQueue ? "active" : ""} onClick={() => setShowQueue(false)}>Reproduciendo</button>
                    {playerState.queue.length > 1 && <button className={showQueue ? "active" : ""} onClick={() => setShowQueue(true)}>Cola ({playerState.queue.length})</button>}
                </div>
                <button onClick={() => playerState.closePlayer()} className="icon-btn no-drag" aria-label="Cerrar">
                  <X size={24} />
                </button>
              </div>

              {!showQueue ? (
                <div className="player-expanded-content">
                  <img src={playerState.currentSong.thumbnail || 'https://placehold.co/400x400/233B5D/FFF?text=Music'} alt={playerState.currentSong.title} className="cover-large" />

                  <div className="info-large">
                    <h2>{playerState.currentSong.title}</h2>
                    <p>{playerState.currentSong.channel_title}</p>
                    {playerState.currentPlaylist && <span className="playlist-badge">De: {playerState.currentPlaylist.title}</span>}
                  </div>

                  <div className="progress-container no-drag">
                    <input
                      type="range"
                      min="0"
                      max={playerState.duration || 100}
                      value={playerState.currentTime || 0}
                      onChange={(e) => {
                        const t = parseFloat(e.target.value);
                        playerState.seek(t);
                      }}
                    />
                    <div className="time-labels">
                      <span>{formatTime(playerState.currentTime)}</span>
                      <span>{formatTime(playerState.duration)}</span>
                    </div>
                  </div>

                  <div className="controls-large no-drag">
                    <button onClick={() => playerState.previous()} disabled={playerState.currentIndex === 0} className="icon-btn">
                      <SkipBack size={32} />
                    </button>
                    <button onClick={() => playerState.isPlaying ? playerState.pause() : playerState.resume()} className="play-btn-large">
                      {playerState.isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                    </button>
                    <button onClick={() => playerState.next()} disabled={playerState.currentIndex >= playerState.queue.length - 1} className="icon-btn">
                      <SkipForward size={32} />
                    </button>
                  </div>

                  <div className="volume-control no-drag">
                     <button onClick={() => playerState.toggleMute()} className="icon-btn-vol" style={{background:'none', border:'none', color:'inherit', cursor:'pointer'}}>
                       {playerState.isMuted || playerState.volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                     </button>
                     <input
                       type="range"
                       min="0" max="100"
                       value={playerState.volume}
                       onChange={(e) => playerState.setVolume(parseInt(e.target.value))}
                     />
                  </div>
                </div>
              ) : (
                <div className="player-expanded-queue no-drag">
                   {playerState.queue.map((item, idx) => (
                      <div key={idx} className={`queue-item ${idx === playerState.currentIndex ? 'active' : ''}`} onClick={() => {
                         playerState.playPlaylist(playerState.currentPlaylist!, playerState.queue, idx);
                      }}>
                         <span className="queue-idx">{idx + 1}</span>
                         <div className="queue-info">
                            <span className="title">{item.title}</span>
                            <span className="artist">{item.channel_title}</span>
                         </div>
                         {idx === playerState.currentIndex && playerState.isPlaying && <span className="playing-icon"><Play size={16} fill="currentColor" /></span>}
                      </div>
                   ))}
                </div>
              )}
            </div>
          ) : (
            <div className="floating-music-player">
              <div className="drag-handle"><GripVertical size={16} /></div>

              <div className="player-left no-drag" onClick={() => playerState.expandPlayer()}>
                <img src={playerState.currentSong.thumbnail || 'https://placehold.co/100x100/233B5D/FFF?text=Music'} alt={playerState.currentSong.title} className="cover-small" />
                <div className="info-small">
                  <strong>{playerState.currentSong.title}</strong>
                  <span>{playerState.currentSong.channel_title} {playerState.currentPlaylist ? `· ${playerState.currentPlaylist.title}` : ''}</span>
                </div>
              </div>

              <div className="player-center no-drag">
                <div className="controls-small">
                  <button onClick={() => playerState.previous()} disabled={playerState.currentIndex === 0} className="icon-btn">
                    <SkipBack size={20} />
                  </button>
                  <button onClick={() => playerState.isPlaying ? playerState.pause() : playerState.resume()} className="play-btn-small">
                    {playerState.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  </button>
                  <button onClick={() => playerState.next()} disabled={playerState.currentIndex >= playerState.queue.length - 1} className="icon-btn">
                    <SkipForward size={20} />
                  </button>
                </div>
                <div className="progress-small">
                   <span>{formatTime(playerState.currentTime)}</span>
                   <input
                      type="range"
                      min="0"
                      max={playerState.duration || 100}
                      value={playerState.currentTime || 0}
                      onChange={(e) => {
                        const t = parseFloat(e.target.value);
                        playerState.seek(t);
                      }}
                    />
                    <span>{formatTime(playerState.duration)}</span>
                </div>
              </div>

              <div className="player-right no-drag">
                <div className="volume-control-small">
                   <button onClick={() => playerState.toggleMute()} className="icon-btn-vol" style={{background:'none', border:'none', color:'inherit', cursor:'pointer'}}>
                     {playerState.isMuted || playerState.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                   </button>
                   <input
                     type="range"
                     min="0" max="100"
                     value={playerState.volume}
                     onChange={(e) => playerState.setVolume(parseInt(e.target.value))}
                   />
                </div>
                <button onClick={() => playerState.expandPlayer()} className="icon-btn no-drag" aria-label="Expandir">
                  <Maximize2 size={20} />
                </button>
                <button onClick={() => playerState.closePlayer()} className="icon-btn no-drag" aria-label="Cerrar">
                  <X size={20} />
                </button>
              </div>
            </div>
          )}
        </DraggablePlayerContainer>
      )}
    </>
  );
}

function DraggablePlayerContainer({ children, isExpanded }: { children: React.ReactNode, isExpanded: boolean }) {
  const [pos, setPos] = useState({ x: -1, y: -1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ startX: number, startY: number, startPosX: number, startPosY: number } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('inkorium-floating-player-position');
      if (stored) {
        const p = JSON.parse(stored);
        setPos(p);
      } else {
        // Default: bottom right. Will be adjusted by resize handler to exact pixels
        setPos({ x: window.innerWidth - 400 - 24, y: window.innerHeight - 100 - 24 });
      }
    } catch(e) {
      setPos({ x: window.innerWidth - 400 - 24, y: window.innerHeight - 100 - 24 });
    }
  }, []);

  const enforceBounds = (x: number, y: number) => {
    if (!containerRef.current) return { x, y };
    const rect = containerRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    let newX = Math.max(0, Math.min(x, maxX));
    let newY = Math.max(0, Math.min(y, maxY));

    return { x: newX, y: newY };
  };

  useEffect(() => {
    if (pos.x === -1) return;
    const handleResize = () => {
      setPos(p => enforceBounds(p.x, p.y));
    };
    window.addEventListener('resize', handleResize);
    // Enforce bounds right away in case content changed size
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [pos.x, isExpanded]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, .no-drag')) return;

    target.setPointerCapture(e.pointerId);
    draggingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;

    const dx = e.clientX - draggingRef.current.startX;
    const dy = e.clientY - draggingRef.current.startY;

    let newX = draggingRef.current.startPosX + dx;
    let newY = draggingRef.current.startPosY + dy;

    const bounded = enforceBounds(newX, newY);

    setPos(bounded);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const target = e.target as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) {
        target.releasePointerCapture(e.pointerId);
    }
    draggingRef.current = null;
    localStorage.setItem('inkorium-floating-player-position', JSON.stringify(pos));
  };

  if (pos.x === -1) return <div ref={containerRef} style={{opacity: 0, position: 'fixed'}}>{children}</div>;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`floating-player-wrapper ${isExpanded ? 'expanded' : 'mini'}`}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        touchAction: 'none',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {children}
    </div>
  );
}
"""

content = pattern.sub(new_return.replace('\\', '\\\\'), content)

with open('src/components_player.tsx', 'w') as f:
    f.write(content)
