const fs = require('fs');
const file = 'src/main.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /\{page === "buscar" && <SearchView query=\{query\} navigate=\{navigate\} goBack=\{history.length > 1 \? goBack : undefined\} \/>\}/,
    '{page === "fotos" && <PhotosPage session={session} profileId={currentRoute.params?.userId} navigate={navigate} />}{page === "buscar" && <SearchView query={query} navigate={navigate} goBack={history.length > 1 ? goBack : undefined} />}'
);

content = content.replace(
    /\["▧", "Fotos", "buscar"\]/,
    '["▧", "Fotos", "fotos"]'
);

content = content.replace(
    /\["musica", "Musica"\]/,
    '["musica", "Musica"], ["fotos", "Fotos"]'
);

fs.writeFileSync(file, content);
console.log("main.tsx render patched");
