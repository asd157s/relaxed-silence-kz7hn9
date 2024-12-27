// App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';

// Interfaces
interface Usuario {
  username: string;
  password: string;
  isAdmin: boolean;
}

interface Pelicula {
  titulo: string;
  descripcion: string;
  link: string;
  imagen: string;
  genero: string;
  año: string;
}

interface Serie {
  titulo: string;
  descripcion: string;
  imagen: string;
  genero: string;
  año: string;
  episodios: { titulo: string; link: string }[];
}

interface IPTVItem {
  title: string;
  url: string;
  tvgLogo?: string;
  groupTitle?: string;
  tvgName?: string;
}

// Componente Login
function LoginComponent({ onLogin }: { onLogin: (usuario: string, contrasena: string) => boolean }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (onLogin(usuario, contrasena)) {
        navigate('/home');
      } else {
        setError('Usuario o contraseña incorrectos');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/30 backdrop-blur-xl p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            D&M STREAM
          </h1>
          <p className="text-gray-400 mt-2">Tu plataforma de streaming</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="Ingresa tu usuario"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
// Funciones de utilidad IPTV
const parseM3U = (content: string): IPTVItem[] => {
  const lines = content.split('\n');
  const items: IPTVItem[] = [];
  let currentItem: Partial<IPTVItem> = {};

  lines.forEach(line => {
    line = line.trim();
    
    if (line.startsWith('#EXTINF:')) {
      const metadataStr = line.substring(line.indexOf(',') + 1);
      currentItem.title = metadataStr.split('tvg-name=')[0].trim();
      
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      if (logoMatch) {
        currentItem.tvgLogo = logoMatch[1];
      }

      const groupMatch = line.match(/group-title="([^"]*)"/);
      if (groupMatch) {
        currentItem.groupTitle = groupMatch[1];
      }

      const nameMatch = line.match(/tvg-name="([^"]*)"/);
      if (nameMatch) {
        currentItem.tvgName = nameMatch[1];
      }
    } else if (line.startsWith('http') || line.startsWith('rtmp')) {
      currentItem.url = line;
      if (currentItem.title) {
        items.push(currentItem as IPTVItem);
      }
      currentItem = {};
    }
  });

  return items;
};

const classifyContent = (items: IPTVItem[]): { peliculas: Pelicula[], series: Serie[] } => {
  const peliculas: Pelicula[] = [];
  const seriesMap = new Map<string, Serie>();

  const tvChannelPatterns = [
    /\b(tv|television|canal|channel)\b/i,
    /\b(news|noticias|deportes|sports)\b/i,
    /\b(hd|sd|fhd|uhd|4k)\b/i,
    /\b(espn|fox|hbo|cnn|bein|discovery|national|history)\b/i,
    /24\/7/i,
    /\b(en vivo|live)\b/i
  ];

  const episodePatterns = [
    /s\d{1,2}e\d{1,2}/i,
    /temporada \d+/i,
    /episodio \d+/i,
    /capitulo \d+/i,
    /\b(t|temp)\d{1,2}(cap|e)\d{1,2}\b/i
  ];

  const isTVChannel = (title: string, groupTitle?: string): boolean => {
    if (tvChannelPatterns.some(pattern => pattern.test(title))) {
      return true;
    }

    if (groupTitle) {
      const lowerGroupTitle = groupTitle.toLowerCase();
      return [
        'tv', 'television', 'canales', 'channels',
        'deportes', 'sports', 'news', 'noticias'
      ].some(keyword => lowerGroupTitle.includes(keyword));
    }

    return false;
  };

  items.forEach(item => {
    if (isTVChannel(item.title, item.groupTitle)) {
      return;
    }

    const isEpisode = episodePatterns.some(pattern => pattern.test(item.title));

    if (isEpisode) {
      let serieTitle = item.title
        .replace(/[\s-]*s\d{1,2}e\d{1,2}/i, '')
        .replace(/[\s-]*temporada \d+/i, '')
        .replace(/[\s-]*episodio \d+/i, '')
        .replace(/[\s-]*capitulo \d+/i, '')
        .replace(/[\s-]*t\d{1,2}(cap|e)\d{1,2}/i, '')
        .replace(/[-_\.]+$/, '')
        .trim();

      const existingSerie = seriesMap.get(serieTitle.toLowerCase());

      const episodio = {
        titulo: item.title,
        link: item.url
      };

      if (existingSerie) {
        if (!existingSerie.episodios.some(ep => ep.link === item.url)) {
          existingSerie.episodios.push(episodio);
        }
      } else {
        seriesMap.set(serieTitle.toLowerCase(), {
          titulo: serieTitle,
          descripcion: '',
          imagen: item.tvgLogo || '',
          genero: item.groupTitle || 'Sin categoría',
          año: new Date().getFullYear().toString(),
          episodios: [episodio]
        });
      }
    } else {
      const moviePatterns = [
        /\(\d{4}\)/,
        /\[\d{4}\]/,
        /\d{4}/,
        /\b(DVDRip|BRRip|BluRay|WEBRip|HDRip)\b/i
      ];

      if (moviePatterns.some(pattern => pattern.test(item.title))) {
        let movieTitle = item.title
          .replace(/\(\d{4}\)/, '')
          .replace(/\[\d{4}\]/, '')
          .replace(/\b\d{4}\b/, '')
          .replace(/\b(DVDRip|BRRip|BluRay|WEBRip|HDRip)\b/i, '')
          .replace(/[-_\.]+$/, '')
          .trim();

        const yearMatch = item.title.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();

        peliculas.push({
          titulo: movieTitle,
          descripcion: '',
          link: item.url,
          imagen: item.tvgLogo || '',
          genero: item.groupTitle || 'Sin categoría',
          año: year
        });
      }
    }
  });

  // Ordenar episodios
  seriesMap.forEach(serie => {
    serie.episodios.sort((a, b) => {
      const getEpisodeNumber = (title: string) => {
        const match = title.match(/e(\d+)|episodio (\d+)|capitulo (\d+)/i);
        return match ? parseInt(match[1] || match[2] || match[3]) : 0;
      };
      return getEpisodeNumber(a.titulo) - getEpisodeNumber(b.titulo);
    });
  });

  return {
    peliculas: peliculas.sort((a, b) => a.titulo.localeCompare(b.titulo)),
    series: Array.from(seriesMap.values()).sort((a, b) => a.titulo.localeCompare(b.titulo))
  };
};

// Componente IPTVImporter
function IPTVImporter({ onImport }: { onImport: (peliculas: Pelicula[], series: Serie[]) => void }) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{
    total: number;
    peliculas: number;
    series: number;
    ignorados: number;
  } | null>(null);

  const handleImport = async () => {
    try {
      setIsLoading(true);
      setError('');
      setStats(null);

      const response = await fetch(url);
      if (!response.ok) throw new Error('No se pudo obtener la lista');
      
      const content = await response.text();
      const items = parseM3U(content);
      const { peliculas, series } = classifyContent(items);
      
      setStats({
        total: items.length,
        peliculas: peliculas.length,
        series: series.length,
        ignorados: items.length - (peliculas.length + series.reduce((acc, s) => acc + s.episodios.length, 0))
      });

      onImport(peliculas, series);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar la lista');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-white">Importar Lista IPTV</h3>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="URL de la lista M3U"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
        {stats && (
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="font-medium mb-2 text-white">Resultados de la importación:</h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>Películas importadas: {stats.peliculas}</li>
              <li>Series importadas: {stats.series}</li>
              <li>Elementos filtrados: {stats.ignorados}</li>
            </ul>
          </div>
        )}
        <button
          onClick={handleImport}
          disabled={isLoading || !url}
          className={`w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium 
            ${isLoading || !url ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-700 hover:to-blue-700'} transition-all`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Importando...
            </span>
          ) : 'Importar Lista'}
        </button>
      </div>
    </div>
  );
}
// Componente ContentCard
function ContentCard({ item, type }: { item: Pelicula | Serie; type: 'pelicula' | 'serie' }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-[2/3] rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
        <img
          src={item.imagen || "/api/placeholder/300/450"}
          alt={item.titulo}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/api/placeholder/300/450";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {isHovered && (
        <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/80 backdrop-blur-md rounded-lg p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-white font-bold mb-1">{item.titulo}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
              <span>{item.año}</span>
              <span>•</span>
              <span>{item.genero}</span>
            </div>
            <p className="text-gray-300 text-sm line-clamp-3 mb-4">{item.descripcion}</p>
            {type === 'pelicula' ? (
              <button
                onClick={() => window.open((item as Pelicula).link, '_blank')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Reproducir
              </button>
            ) : (
              <div className="space-y-2">
                {(item as Serie).episodios.map((episodio, idx) => (
                  <button
                    key={idx}
                    onClick={() => window.open(episodio.link, '_blank')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    {episodio.titulo || `Episodio ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente Home
function Home({ 
  logueado,
  currentUser,
  usuarios,
  peliculas, 
  series,
  onAgregarPelicula,
  onAgregarSerie,
  onAgregarUsuario,
  onEliminarUsuario
}: { 
  logueado: boolean;
  currentUser: Usuario | null;
  usuarios: Usuario[];
  peliculas: Pelicula[];
  series: Serie[];
  onAgregarPelicula: (pelicula: Pelicula) => void;
  onAgregarSerie: (serie: Serie) => void;
  onAgregarUsuario: (usuario: Usuario) => void;
  onEliminarUsuario: (username: string) => void;
}) {
  const [mostrarGestionUsuarios, setMostrarGestionUsuarios] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [showIPTVImporter, setShowIPTVImporter] = useState(false);

  const initialPelicula: Pelicula = {
    titulo: '',
    descripcion: '',
    link: '',
    imagen: '',
    genero: '',
    año: new Date().getFullYear().toString()
  };

  const initialSerie: Serie = {
    titulo: '',
    descripcion: '',
    imagen: '',
    genero: '',
    año: new Date().getFullYear().toString(),
    episodios: []
  };

  const [nuevaPelicula, setNuevaPelicula] = useState<Pelicula>(initialPelicula);
  const [nuevaSerie, setNuevaSerie] = useState<Serie>(initialSerie);
  const [agregarPelicula, setAgregarPelicula] = useState(false);
  const [agregarSerie, setAgregarSerie] = useState(false);

  if (!logueado) {
    return <Navigate to="/" replace />;
  }

  const filteredPeliculas = peliculas.filter(pelicula => 
    pelicula.titulo.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!selectedGenre || pelicula.genero === selectedGenre)
  );

  const filteredSeries = series.filter(serie => 
    serie.titulo.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!selectedGenre || serie.genero === selectedGenre)
  );

  const generos = Array.from(new Set([
    ...peliculas.map(p => p.genero),
    ...series.map(s => s.genero)
  ])).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Navbar */}
      <nav className="bg-black/30 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                D&M STREAM
              </h1>
              <div className="hidden md:flex items-center space-x-4">
                {currentUser?.isAdmin && (
                  <button 
                    onClick={() => setShowIPTVImporter(!showIPTVImporter)}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Importar IPTV
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="py-1 px-3 rounded-full bg-gray-800/50 border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {currentUser?.isAdmin && (
                <button
                  onClick={() => setMostrarGestionUsuarios(!mostrarGestionUsuarios)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 px-4 rounded-lg transition-colors"
                >
                  Gestionar Usuarios
                </button>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-sm">{currentUser?.username}</span>
                {currentUser?.isAdmin && (
                  <span className="bg-purple-600/30 text-purple-300 text-xs px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section - Solo visible para administradores */}
      {currentUser?.isAdmin && (
        <div className="relative py-16 bg-gradient-to-r from-purple-900/90 to-blue-900/90">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-purple-400">{peliculas.length}</div>
                <div className="text-sm text-gray-300">Películas</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400">{series.length}</div>
                <div className="text-sm text-gray-300">Series</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-400">{usuarios.length}</div>
                <div className="text-sm text-gray-300">Usuarios</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="container mx-auto px-4 py-8">
        {/* IPTV Importer */}
        {showIPTVImporter && currentUser?.isAdmin && (
          <div className="mb-8">
            <IPTVImporter 
              onImport={(newPeliculas, newSeries) => {
                onAgregarPelicula(...newPeliculas);
                onAgregarSerie(...newSeries);
              }} 
            />
          </div>
        )}

        {/* Filtros */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-gray-800/50 text-white rounded-lg px-4 py-2 border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">Todos los géneros</option>
              {generos.map(genero => (
                <option key={genero} value={genero}>{genero}</option>
              ))}
            </select>
          </div>
          
          {currentUser?.isAdmin && (
            <div className="flex gap-4">
              <button
                onClick={() => setAgregarPelicula(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <span>+</span> Agregar Película
              </button>
              <button
                onClick={() => setAgregarSerie(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <span>+</span> Agregar Serie
              </button>
            </div>
          )}
        </div>

        {/* Contenido Reciente */}
        {(filteredPeliculas.length > 0 || filteredSeries.length > 0) && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Contenido Reciente</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[...filteredPeliculas, ...filteredSeries]
                .sort((a, b) => b.año.localeCompare(a.año))
                .slice(0, 6)
                .map((item, index) => (
                  <ContentCard
                    key={index}
                    item={item}
                    type={'episodios' in item ? 'serie' : 'pelicula'}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Sección Películas */}
        {filteredPeliculas.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Películas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {filteredPeliculas.map((pelicula, index) => (
                <ContentCard
                  key={index}
                  item={pelicula}
                  type="pelicula"
                />
              ))}
            </div>
          </div>
        )}

        {/* Sección Series */}
        {filteredSeries.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Series</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {filteredSeries.map((serie, index) => (
                <ContentCard
                  key={index}
                  item={serie}
                  type="serie"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal para agregar película */}
      {agregarPelicula && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Agregar Película</h2>
              <button 
                onClick={() => setAgregarPelicula(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Imagen de Carátula (URL)
                </label>
                <input
                  type="text"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={nuevaPelicula.imagen}
                  onChange={(e) => setNuevaPelicula({ ...nuevaPelicula, imagen: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={nuevaPelicula.titulo}
                  onChange={(e) => setNuevaPelicula({ ...nuevaPelicula, titulo: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Descripción
                </label>
                <textarea
                  value={nuevaPelicula.descripcion}
                  onChange={(e) => setNuevaPelicula({ ...nuevaPelicula, descripcion: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Género
                </label>
                <input
                  type="text"
                  value={nuevaPelicula.genero}
                  onChange={(e) => setNuevaPelicula({ ...nuevaPelicula, genero: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Año
                </label>
                <input
                  type="text"
                  value={nuevaPelicula.año}
                  onChange={(e) => setNuevaPelicula({ ...nuevaPelicula, año: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Link del Video
                </label>
                <input
                  type="text"
                  value={nuevaPelicula.link}
                  onChange={(e) => setNuevaPelicula({ ...nuevaPelicula, link: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setAgregarPelicula(false)}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    onAgregarPelicula(nuevaPelicula);
                    setAgregarPelicula(false);
                    setNuevaPelicula(initialPelicula);
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal para agregar serie */}
      {agregarSerie && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Agregar Serie</h2>
              <button 
                onClick={() => setAgregarSerie(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Imagen de Carátula (URL)
                </label>
                <input
                  type="text"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={nuevaSerie.imagen}
                  onChange={(e) => setNuevaSerie({ ...nuevaSerie, imagen: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={nuevaSerie.titulo}
                  onChange={(e) => setNuevaSerie({ ...nuevaSerie, titulo: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Descripción
                </label>
                <textarea
                  value={nuevaSerie.descripcion}
                  onChange={(e) => setNuevaSerie({ ...nuevaSerie, descripcion: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Género
                </label>
                <input
                  type="text"
                  value={nuevaSerie.genero}
                  onChange={(e) => setNuevaSerie({ ...nuevaSerie, genero: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Año
                </label>
                <input
                  type="text"
                  value={nuevaSerie.año}
                  onChange={(e) => setNuevaSerie({ ...nuevaSerie, año: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              {/* Episodios */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Episodios</h3>
                {nuevaSerie.episodios.map((episodio, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">Episodio {index + 1}</span>
                      <button
                        onClick={() => {
                          setNuevaSerie({
                            ...nuevaSerie,
                            episodios: nuevaSerie.episodios.filter((_, i) => i !== index)
                          });
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Título del episodio"
                        value={episodio.titulo}
                        onChange={(e) =>
                          setNuevaSerie({
                            ...nuevaSerie,
                            episodios: nuevaSerie.episodios.map((ep, i) =>
                              i === index ? { ...ep, titulo: e.target.value } : ep
                            ),
                          })
                        }
                        className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        placeholder="Link del episodio"
                        value={episodio.link}
                        onChange={(e) =>
                          setNuevaSerie({
                            ...nuevaSerie,
                            episodios: nuevaSerie.episodios.map((ep, i) =>
                              i === index ? { ...ep, link: e.target.value } : ep
                            ),
                          })
                        }
                        className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setNuevaSerie({
                      ...nuevaSerie,
                      episodios: [...nuevaSerie.episodios, { titulo: '', link: '' }]
                    });
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  + Agregar Episodio
                </button>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setAgregarSerie(false)}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    onAgregarSerie(nuevaSerie);
                    setAgregarSerie(false);
                    setNuevaSerie(initialSerie);
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Agregar Serie
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente principal App
function App() {
  const [logueado, setLogueado] = useState(false);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    { username: 'admin', password: 'admin', isAdmin: true }
  ]);
  const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);

  const handleLogin = (username: string, password: string) => {
    const usuario = usuarios.find(
      u => u.username === username && u.password === password
    );
    
    if (usuario) {
      setLogueado(true);
      setCurrentUser(usuario);
      return true;
    }
    return false;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginComponent onLogin={handleLogin} />} />
        <Route 
          path="/home" 
          element={
            logueado ? (
              <Home 
                logueado={logueado}
                currentUser={currentUser}
                usuarios={usuarios}
                peliculas={peliculas}
                series={series}
                onAgregarPelicula={(pelicula) => setPeliculas([...peliculas, pelicula])}
                onAgregarSerie={(serie) => setSeries([...series, serie])}
                onAgregarUsuario={(usuario) => setUsuarios([...usuarios, usuario])}
                onEliminarUsuario={(username) => {
                  if (username === 'admin') {
                    alert('No se puede eliminar al usuario administrador');
                    return;
                  }
                  setUsuarios(usuarios.filter(u => u.username !== username));
                }}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
