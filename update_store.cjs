const fs = require('fs');
let code = fs.readFileSync('src/lib/store.ts', 'utf8');

if (!code.includes('setIsPlaying:')) {
  code = code.replace(
    /updateProgress: \(currentTime: number, duration: number\) => void;/,
    "updateProgress: (currentTime: number, duration: number) => void;\n  setIsPlaying: (isPlaying: boolean) => void;"
  );

  code = code.replace(
    /updateProgress: \(currentTime, duration\) => set\(\{ currentTime, duration \}\),/,
    "updateProgress: (currentTime, duration) => set({ currentTime, duration }),\n  setIsPlaying: (isPlaying) => set({ isPlaying }),"
  );
  fs.writeFileSync('src/lib/store.ts', code);
  console.log("updated");
} else {
  console.log("already updated");
}
