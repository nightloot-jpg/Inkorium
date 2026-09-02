export interface CountryLocation {
  id: string;
  name: string;
  code: string;
  flag: string;
  zones: string[];
}

export const COUNTRIES_LIST: CountryLocation[] = [
  {
    id: 'espana',
    name: 'España',
    code: 'ES',
    flag: '🇪🇸',
    zones: [
      'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona', 
      'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ceuta', 'Ciudad Real', 'Córdoba', 
      'Cuenca', 'Girona', 'Granada', 'Guadalajara', 'Guipúzcoa', 'Huelva', 'Huesca', 'Islas Baleares (Mallorca, Ibiza, Menorca)', 
      'Jaén', 'La Coruña', 'La Rioja', 'Las Palmas (Gran Canaria, Lanzarote, Fuerteventura)', 'León', 'Lleida', 'Lugo', 
      'Madrid', 'Málaga', 'Melilla', 'Murcia', 'Navarra', 'Ourense', 'Palencia', 'Pontevedra (Vigo)', 
      'Salamanca', 'Santa Cruz de Tenerife (Tenerife, La Palma)', 'Segovia', 'Sevilla', 'Soria', 
      'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Vizcaya (Bilbao)', 'Zamora', 'Zaragoza'
    ]
  },
  {
    id: 'mexico',
    name: 'México',
    code: 'MX',
    flag: '🇲🇽',
    zones: [
      'Aguascalientes', 'Baja California (Tijuana, Mexicali)', 'Baja California Sur (La Paz, Los Cabos)', 
      'Campeche', 'Chiapas', 'Chihuahua (Ciudad Juárez)', 'Ciudad de México (CDMX)', 'Coahuila (Saltillo, Torreón)', 
      'Colima', 'Durango', 'Estado de México (Toluca, Ecatepec)', 'Guanajuato (León)', 'Guerrero (Acapulco)', 
      'Hidalgo (Pachuca)', 'Jalisco (Guadalajara, Zapopan)', 'Michoacán (Morelia)', 'Morelos (Cuernavaca)', 
      'Nayarit', 'Nuevo León (Monterrey)', 'Oaxaca', 'Puebla', 'Querétaro', 
      'Quintana Roo (Cancún, Playa del Carmen)', 'San Luis Potosí', 'Sinaloa (Culiacán, Mazatlán)', 
      'Sonora (Hermosillo)', 'Tabasco (Villahermosa)', 'Tamaulipas', 'Tlaxcala', 'Veracruz (Xalapa, Puerto)', 
      'Yucatán (Mérida)', 'Zacatecas'
    ]
  },
  {
    id: 'argentina',
    name: 'Argentina',
    code: 'AR',
    flag: '🇦🇷',
    zones: [
      'Buenos Aires (CABA - Capital Federal)', 'Buenos Aires (GBA / Provincia)', 'Catamarca', 'Chaco', 
      'Chubut (Comodoro Rivadavia, Puerto Madryn)', 'Córdoba (Capital, Carlos Paz)', 'Corrientes', 
      'Entre Ríos (Paraná)', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 
      'Mendoza (Capital, San Rafael)', 'Misiones (Posadas, Iguazú)', 'Neuquén', 'Río Negro (Bariloche)', 
      'Salta', 'San Juan', 'San Luis', 'Santa Cruz (El Calafate)', 'Santa Fe (Rosario, Capital)', 
      'Santiago del Estero', 'Tierra del Fuego (Ushuaia)', 'Tucumán (San Miguel)'
    ]
  },
  {
    id: 'colombia',
    name: 'Colombia',
    code: 'CO',
    flag: '🇨🇴',
    zones: [
      'Amazonas (Leticia)', 'Antioquia (Medellín, Envigado)', 'Arauca', 'Atlántico (Barranquilla)', 
      'Bogotá D.C.', 'Bolívar (Cartagena)', 'Boyacá (Tunja)', 'Caldas (Manizales)', 
      'Caquetá', 'Casanare', 'Cauca (Popayán)', 'Cesar (Valledupar)', 'Chocó', 
      'Córdoba (Montería)', 'Cundinamarca (Soacha, Chía)', 'Guainía', 'Guaviare', 
      'Huila (Neiva)', 'La Guajira (Riohacha)', 'Magdalena (Santa Marta)', 'Meta (Villavicencio)', 
      'Nariño (Pasto)', 'Norte de Santander (Cúcuta)', 'Putumayo', 'Quindío (Armenia)', 
      'Risaralda (Pereira)', 'San Andrés y Providencia', 'Santander (Bucaramanga)', 'Sucre (Sincelejo)', 
      'Tolima (Ibagué)', 'Valle del Cauca (Cali, Buenaventura)', 'Vaupés', 'Vichada'
    ]
  },
  {
    id: 'chile',
    name: 'Chile',
    code: 'CL',
    flag: '🇨🇱',
    zones: [
      'Región Metropolitana (Santiago)', 'Valparaíso (Viña del Mar, Valparaíso)', 'Biobío (Concepción)', 
      'Antofagasta (Calama)', 'Araucanía (Temuco)', 'Coquimbo (La Serena, Coquimbo)', 
      'Los Lagos (Puerto Montt, Osorno)', 'O\'Higgins (Rancagua)', 'Maule (Talca, Curicó)', 
      'Tarapacá (Iquique)', 'Los Ríos (Valdivia)', 'Arica y Parinacota', 'Atacama (Copiapó)', 
      'Aysén (Coyhaique)', 'Magallanes (Punta Arenas)', 'Ñuble (Chillán)'
    ]
  },
  {
    id: 'peru',
    name: 'Perú',
    code: 'PE',
    flag: '🇵🇪',
    zones: [
      'Lima Metropolitana', 'Lima Región', 'Arequipa', 'Cusco', 'La Libertad (Trujillo)', 
      'Piura', 'Lambayeque (Chiclayo)', 'Ancash (Chimbote, Huaraz)', 'Junín (Huancayo)', 
      'Ica (Chincha, Nazca)', 'Loreto (Iquitos)', 'Cajamarca', 'Puno (Juliaca)', 
      'San Martín (Tarapoto)', 'Tacna', 'Ucayali (Pucallpa)', 'Ayacucho', 'Huánuco', 
      'Apurímac', 'Amazonas', 'Moquegua', 'Pasco', 'Huancavelica', 'Madre de Dios (Puerto Maldonado)', 'Tumbes'
    ]
  },
  {
    id: 'estados_unidos',
    name: 'Estados Unidos',
    code: 'US',
    flag: '🇺🇸',
    zones: [
      'California (Los Ángeles, San Francisco, San Diego)', 'Nueva York (NYC)', 'Florida (Miami, Orlando, Tampa)', 
      'Texas (Houston, Dallas, Austin, San Antonio)', 'Illinois (Chicago)', 'Washington (Seattle)', 
      'Massachusetts (Boston)', 'Pensilvania (Filadelfia)', 'Georgia (Atlanta)', 'Colorado (Denver)', 
      'Arizona (Phoenix)', 'Nevada (Las Vegas)', 'Nueva Jersey', 'Oregón (Portland)', 'Ohio', 
      'Carolina del Norte (Charlotte)', 'Virginia', 'Hawái (Honolulu)', 'Puerto Rico (San Juan)'
    ]
  },
  {
    id: 'venezuela',
    name: 'Venezuela',
    code: 'VE',
    flag: '🇻🇪',
    zones: [
      'Distrito Capital (Caracas)', 'Zulia (Maracaibo)', 'Carabobo (Valencia)', 'Miranda (Los Teques, Petare)', 
      'Lara (Barquisimeto)', 'Aragua (Maracay)', 'Anzoátegui (Barcelona, Puerto La Cruz)', 'Bolívar (Ciudad Guayana)', 
      'Táchira (San Cristóbal)', 'Mérida', 'Falcón (Coro, Punto Fijo)', 'Nueva Esparta (Margarita)', 
      'Monagas (Maturín)', 'Sucre (Cumaná)', 'Trujillo', 'Yaracuy', 'Portuguesa', 'Barinas', 'Guárico'
    ]
  },
  {
    id: 'ecuador',
    name: 'Ecuador',
    code: 'EC',
    flag: '🇪🇨',
    zones: [
      'Pichincha (Quito)', 'Guayas (Guayaquil)', 'Azuay (Cuenca)', 'Manabí (Manta, Portoviejo)', 
      'El Oro (Machala)', 'Tungurahua (Ambato)', 'Loja', 'Imbabura (Ibarra)', 
      'Chimborazo (Riobamba)', 'Santo Domingo de los Tsáchilas', 'Esmeraldas', 'Cotopaxi (Latacunga)', 
      'Los Ríos (Quevedo)', 'Galápagos', 'Pastaza', 'Sucumbíos'
    ]
  },
  {
    id: 'republica_dominicana',
    name: 'República Dominicana',
    code: 'DO',
    flag: '🇩🇴',
    zones: [
      'Distrito Nacional (Santo Domingo)', 'Santo Domingo Provincia', 'Santiago de los Caballeros', 
      'La Altagracia (Punta Cana, Higüey)', 'Puerto Plata', 'La Romana', 'San Cristóbal', 
      'La Vega', 'Duarte (San Francisco de Macorís)', 'Samaná (Las Terrenas)', 'San Pedro de Macorís', 
      'Espaillat (Moca)', 'Barahona', 'Peravia (Baní)', 'Monte Cristi'
    ]
  },
  {
    id: 'uruguay',
    name: 'Uruguay',
    code: 'UY',
    flag: '🇺🇾',
    zones: [
      'Montevideo', 'Canelones (Ciudad de la Costa)', 'Maldonado (Punta del Este)', 'Salto', 
      'Paysandú', 'Colonia (Colonia del Sacramento)', 'Rivera', 'San José', 
      'Tacuarembó', 'Rocha (La Paloma, Punta del Diablo)', 'Soriano', 'Cerro Largo', 
      'Artigas', 'Lavalleja', 'Durazno', 'Florida', 'Treinta y Tres', 'Río Negro', 'Flores'
    ]
  },
  {
    id: 'bolivia',
    name: 'Bolivia',
    code: 'BO',
    flag: '🇧🇴',
    zones: [
      'Santa Cruz (Santa Cruz de la Sierra)', 'La Paz (La Paz, El Alto)', 'Cochabamba', 
      'Oruro', 'Potosí (Uyuni)', 'Chuquisaca (Sucre)', 'Tarija', 'Beni (Trinidad)', 'Pando (Cobija)'
    ]
  },
  {
    id: 'costa_rica',
    name: 'Costa Rica',
    code: 'CR',
    flag: '🇨🇷',
    zones: [
      'San José', 'Alajuela', 'Cartago', 'Heredia', 
      'Guanacaste (Liberia, Tamarindo)', 'Puntarenas (Jacó, Manuel Antonio)', 'Limón (Puerto Viejo)'
    ]
  },
  {
    id: 'panama',
    name: 'Panamá',
    code: 'PA',
    flag: '🇵🇦',
    zones: [
      'Panamá (Ciudad de Panamá)', 'Panamá Oeste (La Chorrera)', 'Chiriquí (David, Boquete)', 
      'Colón', 'Coclé (Penonomé)', 'Veraguas (Santiago)', 'Herrera (Chitré)', 
      'Los Santos (Las Tablas)', 'Bocas del Toro'
    ]
  },
  {
    id: 'guatemala',
    name: 'Guatemala',
    code: 'GT',
    flag: '🇬🇹',
    zones: [
      'Guatemala (Ciudad de Guatemala)', 'Sacatepéquez (Antigua Guatemala)', 'Quetzaltenango (Xela)', 
      'Escuintla', 'Alta Verapaz (Cobán)', 'Petén (Flores, Tikal)', 'San Marcos', 
      'Chimaltenango', 'Izabal (Puerto Barrios)', 'Sololá (Lago de Atitlán)', 'Retalhuleu', 'Huehuetenango'
    ]
  },
  {
    id: 'paraguay',
    name: 'Paraguay',
    code: 'PY',
    flag: '🇵🇾',
    zones: [
      'Asunción (Capital)', 'Central (San Lorenzo, Luque, Lambaré)', 'Alto Paraná (Ciudad del Este)', 
      'Itapúa (Encarnación)', 'Caaguazú (Coronel Oviedo)', 'Cordillera (San Bernardino)', 
      'Concepción', 'Guairá (Villarrica)', 'Amambay (Pedro Juan Caballero)', 'Presidente Hayes'
    ]
  },
  {
    id: 'cuba',
    name: 'Cuba',
    code: 'CU',
    flag: '🇨🇺',
    zones: [
      'La Habana', 'Santiago de Cuba', 'Matanzas (Varadero)', 'Holguín', 'Camagüey', 
      'Villa Clara (Santa Clara)', 'Cienfuegos', 'Pinar del Río (Viñales)', 'Sancti Spíritus (Trinidad)', 
      'Guantánamo', 'Granma', 'Las Tunas', 'Artemisa', 'Mayabeque', 'Isla de la Juventud'
    ]
  },
  {
    id: 'el_salvador',
    name: 'El Salvador',
    code: 'SV',
    flag: '🇸🇻',
    zones: [
      'San Salvador', 'La Libertad (Santa Tecla, El Tunco)', 'Santa Ana', 'San Miguel', 
      'Sonsonate', 'Usulután', 'Ahuachapán', 'La Paz', 'Chalatenango', 'Cuscatlán', 'Morazán'
    ]
  },
  {
    id: 'honduras',
    name: 'Honduras',
    code: 'HN',
    flag: '🇭🇳',
    zones: [
      'Francisco Morazán (Tegucigalpa)', 'Cortés (San Pedro Sula)', 'Atlántida (La Ceiba)', 
      'Islas de la Bahía (Roatán, Utila)', 'Choluteca', 'Comayagua', 'Yoro', 'Copán (Santa Rosa)', 'Colón'
    ]
  },
  {
    id: 'nicaragua',
    name: 'Nicaragua',
    code: 'NI',
    flag: '🇳🇮',
    zones: [
      'Managua', 'León', 'Granada', 'Matagalpa', 'Masaya', 'Chinandega', 
      'Rivas (San Juan del Sur)', 'Estelí', 'Carazo', 'Jinotega', 'Costa Caribe Norte', 'Costa Caribe Sur'
    ]
  },
  {
    id: 'puerto_rico',
    name: 'Puerto Rico',
    code: 'PR',
    flag: '🇵🇷',
    zones: [
      'San Juan', 'Bayamón', 'Carolina', 'Ponce', 'Caguas', 'Guaynabo', 
      'Mayagüez', 'Arecibo', 'Rincón', 'Aguadilla', 'Trujillo Alto', 'Toa Baja', 'Humacao', 'Fajardo', 'Culebra / Vieques'
    ]
  },
  {
    id: 'reino_unido',
    name: 'Reino Unido',
    code: 'GB',
    flag: '🇬🇧',
    zones: [
      'Gran Londres (Londres / London)', 'Gran Mánchester (Manchester)', 'Tierras Medias (Birmingham)', 
      'Escocia (Edimburgo, Glasgow)', 'Gales (Cardiff, Swansea)', 'Yorkshire (Leeds, Sheffield)', 
      'Merseyside (Liverpool)', 'Irlanda del Norte (Belfast)', 'Suroeste (Bristol)', 'Noreste (Newcastle)'
    ]
  },
  {
    id: 'francia',
    name: 'Francia',
    code: 'FR',
    flag: '🇫🇷',
    zones: [
      'Île-de-France (París)', 'Auvernia-Ródano-Alpes (Lyon, Grenoble)', 'Provenza-Alpes-Costa Azul (Marsella, Niza)', 
      'Nueva Aquitania (Burdeos)', 'Occitania (Toulouse, Montpellier)', 'Gran Este (Estrasburgo)', 
      'Países del Loira (Nantes)', 'Bretaña (Rennes)', 'Alta Francia (Lille)', 'Normandía (Ruan)'
    ]
  },
  {
    id: 'alemania',
    name: 'Alemania',
    code: 'DE',
    flag: '🇩🇪',
    zones: [
      'Berlín', 'Baviera (Múnich, Núremberg)', 'Renania del Norte-Westfalia (Colonia, Düsseldorf)', 
      'Baden-Wurtemberg (Stuttgart, Karlsruhe)', 'Hesse (Fráncfort)', 'Hamburgo', 
      'Sajonia (Dresde, Leipzig)', 'Baja Sajonia (Hannover)', 'Bremen', 'Renania-Palatinado (Maguncia)'
    ]
  },
  {
    id: 'italia',
    name: 'Italia',
    code: 'IT',
    flag: '🇮🇹',
    zones: [
      'Lacio (Roma)', 'Lombardía (Milán, Bérgamo)', 'Campania (Nápoles)', 'Piamonte (Turín)', 
      'Véneto (Venecia, Verona)', 'Toscana (Florencia, Pisa)', 'Emilia-Romaña (Bolonia, Parma)', 
      'Sicilia (Palermo, Catania)', 'Apulia (Bari)', 'Cerdeña (Cagliari)', 'Liguria (Génova)'
    ]
  },
  {
    id: 'portugal',
    name: 'Portugal',
    code: 'PT',
    flag: '🇵🇹',
    zones: [
      'Lisboa (Lisboa, Sintra, Cascais)', 'Oporto (Porto, Vila Nova de Gaia)', 'Braga (Braga, Guimarães)', 
      'Setúbal', 'Aveiro', 'Faro (Algarve / Albufeira, Portimão)', 'Coímbra', 'Leiria', 
      'Santarém', 'Viseu', 'Viana do Castelo', 'Madeira (Funchal)', 'Azores (Ponta Delgada)'
    ]
  },
  {
    id: 'brasil',
    name: 'Brasil',
    code: 'BR',
    flag: '🇧🇷',
    zones: [
      'São Paulo (São Paulo, Campinas)', 'Rio de Janeiro (Rio de Janeiro, Niterói)', 
      'Minas Gerais (Belo Horizonte)', 'Bahia (Salvador)', 'Rio Grande do Sul (Porto Alegre)', 
      'Paraná (Curitiba)', 'Ceará (Fortaleza)', 'Distrito Federal (Brasília)', 
      'Santa Catarina (Florianópolis, Joinville)', 'Pernambuco (Recife)', 'Goiás (Goiânia)', 'Amazonas (Manaus)'
    ]
  },
  {
    id: 'andorra',
    name: 'Andorra',
    code: 'AD',
    flag: '🇦🇩',
    zones: [
      'Andorra la Vella', 'Escaldes-Engordany', 'Encamp', 'Sant Julià de Lòria', 
      'La Massana', 'Canillo', 'Ordino'
    ]
  },
  {
    id: 'japon',
    name: 'Japón',
    code: 'JP',
    flag: '🇯🇵',
    zones: [
      'Tokio (Tokyo, Shibuya, Shinjuku)', 'Osaka', 'Kioto (Kyoto)', 'Kanagawa (Yokohama)', 
      'Aichi (Nagoya)', 'Fukuoka', 'Hokkaido (Sapporo)', 'Hyogo (Kobe)', 'Hiroshima', 'Okinawa (Naha)'
    ]
  },
  {
    id: 'canada',
    name: 'Canadá',
    code: 'CA',
    flag: '🇨🇦',
    zones: [
      'Ontario (Toronto, Ottawa)', 'Quebec (Montreal, Ciudad de Quebec)', 
      'Columbia Británica (Vancouver, Victoria)', 'Alberta (Calgary, Edmonton)', 
      'Manitoba (Winnipeg)', 'Nueva Escocia (Halifax)'
    ]
  },
  {
    id: 'australia',
    name: 'Australia',
    code: 'AU',
    flag: '🇦🇺',
    zones: [
      'Nueva Gales del Sur (Sídney / Sydney)', 'Victoria (Melbourne)', 'Queensland (Brisbane, Gold Coast)', 
      'Australia Occidental (Perth)', 'Australia Meridional (Adelaida)', 'Tasmania (Hobart)', 'Territorio de la Capital (Canberra)'
    ]
  }
];

// Helper: Spain's provinces for classic compatibility
export const PROVINCIAS_ESPANA: string[] = COUNTRIES_LIST.find(c => c.id === 'espana')?.zones || [];

// Helper: Get list of all country names
export const ALL_COUNTRIES: string[] = COUNTRIES_LIST.map(c => c.name);

// Helper: Get zones for a given country name or ID
export function getZonesForCountry(countryNameOrId?: string): string[] {
  if (!countryNameOrId) return PROVINCIAS_ESPANA;
  const match = COUNTRIES_LIST.find(
    c => c.name.toLowerCase() === countryNameOrId.toLowerCase() || 
         c.id.toLowerCase() === countryNameOrId.toLowerCase() ||
         c.code.toLowerCase() === countryNameOrId.toLowerCase()
  );
  return match ? match.zones : [];
}

// Helper: Find country by zone name
export function getCountryByZone(zoneName?: string): CountryLocation | undefined {
  if (!zoneName) return undefined;
  const lower = zoneName.toLowerCase().trim();
  for (const country of COUNTRIES_LIST) {
    if (country.zones.some(z => z.toLowerCase().includes(lower) || lower.includes(z.toLowerCase()))) {
      return country;
    }
  }
  return undefined;
}

// Helper: Format location with country and flag
export function formatFullLocation(pais?: string, provincia?: string, ciudad?: string): string {
  const parts: string[] = [];
  if (ciudad?.trim()) parts.push(ciudad.trim());
  if (provincia?.trim()) parts.push(provincia.trim());
  
  let countryObj: CountryLocation | undefined;
  if (pais?.trim()) {
    countryObj = COUNTRIES_LIST.find(c => c.name.toLowerCase() === pais.toLowerCase() || c.id === pais.toLowerCase());
  }
  if (!countryObj && provincia) {
    countryObj = getCountryByZone(provincia);
  }

  if (countryObj) {
    // If not already included in parts
    if (!parts.some(p => p.toLowerCase() === countryObj?.name.toLowerCase())) {
      parts.push(`${countryObj.name} ${countryObj.flag}`);
    }
  } else if (pais?.trim()) {
    parts.push(pais.trim());
  } else {
    // Default fallback to España
    parts.push('España 🇪🇸');
  }

  return parts.filter(Boolean).join(', ') || 'España 🇪🇸';
}
