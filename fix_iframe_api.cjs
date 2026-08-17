const fs = require('fs');

let code = fs.readFileSync('src/components_player.tsx', 'utf8');

const initPlayerFunc = `const initPlayer = () => {`;
const insertScript = `useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);\n\n  useEffect(() => {\n    // YT API init`;

code = code.replace(`useEffect(() => {\n    // YT API init`, insertScript);

fs.writeFileSync('src/components_player.tsx', code);
console.log('done fixing iframe api loading');
