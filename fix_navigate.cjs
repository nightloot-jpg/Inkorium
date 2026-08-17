const fs = require('fs');
const file = 'src/components/PhotosPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    'navigate: (page: string, params?: Record<string, any>) => void;',
    'navigate: (page: "inicio" | "perfil" | "mensajes" | "personas" | "musica" | "buscar" | "fotos", params?: Record<string, any>) => void;'
);

fs.writeFileSync(file, content);
console.log("Fixed navigate type");
