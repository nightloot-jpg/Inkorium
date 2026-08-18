const fs = require('fs');
let code = fs.readFileSync('./src/features/music/MusicView.tsx', 'utf8');

// The file was written using a here doc with double backslashes, so \` became \\\` but we want plain \`
// Let's replace the whole fetch string carefully
const search = "fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=15&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`);";

// If the backslashes are actually in the string:
code = code.replace(/\\\`/g, "\`");
code = code.replace(/\\\$/g, "$");

fs.writeFileSync('./src/features/music/MusicView.tsx', code);
