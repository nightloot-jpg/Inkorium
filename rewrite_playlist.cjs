const fs = require('fs');

let code = fs.readFileSync('src/YoutubePlaylist.tsx', 'utf8');

// The logic inside YoutubePlaylist looks mostly correct as it updates the Zustand store appropriately,
// e.g. playerState.pause(), playerState.resume(), playerState.playPlaylist(...).
// Let's ensure the toggle play logic on the individual tracks is correct.

const trackPlayStr = `onClick={() => playTrack(i)}`;
const newTrackPlayStr = `onClick={() => {
                                if (isActive) {
                                    if (playerState.isPlaying) {
                                        playerState.pause();
                                    } else {
                                        playerState.resume();
                                    }
                                } else {
                                    playTrack(i);
                                }
                            }}`;

code = code.replace(trackPlayStr, newTrackPlayStr);

fs.writeFileSync('src/YoutubePlaylist.tsx', code);
console.log('done rewriting playlist');
