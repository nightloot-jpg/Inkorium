const fs = require('fs');
let code = fs.readFileSync('./src/main.tsx', 'utf8');
const search = `import { formatTime } from "./components_player";`;
const replace = `import { formatTime } from "./components_player";\nimport { MusicView } from "./features/music/MusicView";`;
if(code.includes(search)) {
  code = code.replace(search, replace);
} else {
  code = code.replace(
    `import { FloatingMusicPlayer, formatTime } from "./components_player";`,
    `import { FloatingMusicPlayer, formatTime } from "./components_player";\nimport { MusicView } from "./features/music/MusicView";`
  );
}
fs.writeFileSync('./src/main.tsx', code);
