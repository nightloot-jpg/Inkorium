const fs = require('fs');
const file = 'src/main.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add 'fotos' to Page type
content = content.replace(/type Page = "inicio" \| "perfil" \| "mensajes" \| "personas" \| "musica" \| "buscar";/, 'type Page = "inicio" | "perfil" | "mensajes" | "personas" | "musica" | "buscar" | "fotos";');

// 2. Import PhotosPage
if (!content.includes('import { PhotosPage }')) {
    content = content.replace('import { Composer } from \'./components/Composer\';', 'import { Composer } from \'./components/Composer\';\nimport { PhotosPage } from \'./components/PhotosPage\';');
}

// 3. Add to Navbar/Sidebar navigation
// In AppLayout sidebar:
content = content.replace(
    /<button className={page === "mensajes" \? "active" : ""} onClick=\{\(\) => navigate\("mensajes"\)\}/,
    '<button className={page === "fotos" ? "active" : ""} onClick={() => navigate("fotos")}><ImageIcon size={20} /><span>Fotos</span></button>\n          <button className={page === "mensajes" ? "active" : ""} onClick={() => navigate("mensajes")}'
);

// 4. Render PhotosPage in AppLayout
if (content.includes('page === "buscar" ? <SearchView query={searchQuery} navigate={navigate} /> :')) {
    content = content.replace(
        'page === "buscar" ? <SearchView query={searchQuery} navigate={navigate} /> :',
        'page === "fotos" ? <PhotosPage session={session} navigate={navigate} /> :\n        page === "buscar" ? <SearchView query={searchQuery} navigate={navigate} /> :'
    );
} else {
    console.log("Could not find exact injection point for page render");
}

// Ensure ImageIcon is imported in main.tsx if not already (it is imported from lucide-react in main.tsx)
fs.writeFileSync(file, content);
console.log("main.tsx patched");
