const fs = require('fs');
const file = 'src/main.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { PhotosPage }')) {
    content = content.replace('import { Composer } from \'./components/Composer\';', 'import { Composer } from \'./components/Composer\';\nimport { PhotosPage } from \'./components/PhotosPage\';');
    fs.writeFileSync(file, content);
}
console.log("main.tsx import patched");
