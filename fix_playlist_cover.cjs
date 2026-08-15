const fs = require('fs');

let code = fs.readFileSync('src/YoutubePlaylist.tsx', 'utf8');

const coverStr = `onClick={() => { if (tracks.length > 0) { playerState.playPlaylist({ type: "youtube_playlist", playlist_id: media.playlist_id || media.youtube_id, title: media.title || "Playlist" }, tracks, 0, true); } }}`;

const newCoverStr = `onClick={() => {
                                if (isActivePlaylist) {
                                    if (playerState.isPlaying) playerState.pause();
                                    else playerState.resume();
                                } else if (tracks.length > 0) {
                                    playerState.playPlaylist({ type: "youtube_playlist", playlist_id: media.playlist_id || media.youtube_id, title: media.title || "Playlist" }, tracks, 0, false);
                                }
                            }}`;

code = code.replace(coverStr, newCoverStr);

fs.writeFileSync('src/YoutubePlaylist.tsx', code);
console.log('done fixing cover click');
