const fs = require('fs');
let code = fs.readFileSync('src/components_player.tsx', 'utf8');
if (code.includes('iframe_api')) {
  console.log("iframe_api is already in components_player.tsx");
} else {
  console.log("iframe_api is NOT in components_player.tsx");
}
