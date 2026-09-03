import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useInkorium } from '../context/InkoriumContext';
import { 
  Upload, Image as ImageIcon, Plus, Check, Sliders, Loader2, RefreshCw, 
  Camera, AlertCircle, FileCheck, ShieldCheck, Globe, Users, Lock, UserCheck, 
  Search, X, CheckSquare, Square, Folder, FolderPlus, FolderOpen, ChevronDown, ChevronUp
} from 'lucide-react';
import { PhotoEditorControls } from './PhotoEditorControls';
import { PhotoEditState, DEFAULT_EDIT_STATE, bakeEditedImage } from '../utils/imageEditor';
import { uploadMediaFile } from '../lib/storage';
import { validateImageFile, formatFileSize, FileValidationResult } from '../utils/validation';
import { PhotoPrivacy } from '../types';

export const UploadModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { albums, photos, currentUser, users, uploadPhoto, createAlbum, getFriendsOf } = useInkorium();

  const [title, setTitle] = useState('');
  const [albumId, setAlbumId] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidation, setFileValidation] = useState<FileValidationResult | null>(null);
  const [isValidatingFile, setIsValidatingFile] = useState(false);
  const [editState, setEditState] = useState<PhotoEditState>({ ...DEFAULT_EDIT_STATE });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showNewAlbumInput, setShowNewAlbumInput] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Album Dropdown State
  const [isAlbumDropdownOpen, setIsAlbumDropdownOpen] = useState(false);
  const [albumSearchQuery, setAlbumSearchQuery] = useState('');
  const albumDropdownRef = useRef<HTMLDivElement>(null);

  // Privacy State
  const [privacy, setPrivacy] = useState<PhotoPrivacy>('amigos');
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available friends list for custom privacy selection
  const friendsList = useMemo(() => {
    const friends = getFriendsOf(currentUser.id);
    return friends.length > 0 ? friends : users.filter(u => u.id !== currentUser.id);
  }, [getFriendsOf, currentUser.id, users]);

  const filteredFriends = useMemo(() => {
    if (!friendSearchQuery.trim()) return friendsList;
    const q = friendSearchQuery.toLowerCase();
    return friendsList.filter(f => {
      const name = `${f.nombre} ${f.apellidos}`.toLowerCase();
      const username = (f.username || '').toLowerCase();
      const city = (f.ciudad || f.provincia || '').toLowerCase();
      return name.includes(q) || username.includes(q) || city.includes(q);
    });
  }, [friendsList, friendSearchQuery]);

  const toggleAllowedUser = (userId: string) => {
    setAllowedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllFriends = () => {
    setAllowedUserIds(friendsList.map(f => f.id));
  };

  const deselectAllFriends = () => {
    setAllowedUserIds([]);
  };

  // User's own albums or general albums
  const myAlbums = useMemo(() => {
    return albums.filter(a => !a.userId || a.userId === currentUser.id || a.propietarioId === currentUser.id);
  }, [albums, currentUser.id]);

  // Photo counts and preview covers for each album
  const albumDetailsMap = useMemo(() => {
    const counts: Record<string, number> = {};
    const covers: Record<string, string> = {};
    photos.forEach(p => {
      if (p.albumId) {
        counts[p.albumId] = (counts[p.albumId] || 0) + 1;
        if (!covers[p.albumId] && p.archivo) {
          covers[p.albumId] = p.archivo;
        }
      }
    });
    return { counts, covers };
  }, [photos]);

  const selectedAlbum = useMemo(() => {
    return myAlbums.find(a => a.id === albumId);
  }, [myAlbums, albumId]);

  const filteredAlbums = useMemo(() => {
    if (!albumSearchQuery.trim()) return myAlbums;
    const q = albumSearchQuery.toLowerCase();
    return myAlbums.filter(a => 
      a.nombre.toLowerCase().includes(q) || 
      (a.descripcion && a.descripcion.toLowerCase().includes(q))
    );
  }, [myAlbums, albumSearchQuery]);

  // Close album dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (albumDropdownRef.current && !albumDropdownRef.current.contains(event.target as Node)) {
        setIsAlbumDropdownOpen(false);
      }
    };
    if (isAlbumDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAlbumDropdownOpen]);

  const handleSelectStarterAlbum = (albumName: string) => {
    const existing = myAlbums.find(a => a.nombre.toLowerCase() === albumName.toLowerCase());
    if (existing) {
      setAlbumId(existing.id);
    } else {
      const newId = createAlbum(albumName);
      if (newId) {
        setAlbumId(newId);
      }
    }
    setIsAlbumDropdownOpen(false);
  };

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setIsValidatingFile(true);

    try {
      const validation = await validateImageFile(file, {
        maxSizeBytes: 12 * 1024 * 1024, // 12 MB
        maxWidth: 6000,
        maxHeight: 6000
      });

      setFileValidation(validation);

      if (!validation.isValid) {
        setErrorMessage(validation.message || 'El archivo seleccionado no es válido.');
        setIsValidatingFile(false);
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotoUrl(e.target.result as string);
          setEditState({ ...DEFAULT_EDIT_STATE });
          if (!title) {
            const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
            setTitle(autoTitle);
          }
        }
        setIsValidatingFile(false);
      };
      reader.onerror = () => {
        setErrorMessage('No se pudo leer el archivo seleccionado.');
        setIsValidatingFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage('Error al validar la imagen seleccionada.');
      setIsValidatingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCreateNewAlbum = () => {
    if (!newAlbumName.trim()) return;
    const createdId = createAlbum(newAlbumName.trim());
    if (createdId) {
      setAlbumId(createdId);
    }
    setNewAlbumName('');
    setShowNewAlbumInput(false);
    setIsAlbumDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl || isProcessing) return;

    if (privacy === 'eleccion' && allowedUserIds.length === 0) {
      setErrorMessage('Por favor selecciona al menos una persona que pueda ver esta foto.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      // 1. Bake all filters, rotation, adjustments and retro date stamp onto canvas
      const bakedDataUrl = await bakeEditedImage(photoUrl, editState);

      // 2. Upload to storage bucket (Supabase / R2 / base64 fallback)
      const storedUrl = await uploadMediaFile(bakedDataUrl, 'photos');

      // 3. Register photo in context
      uploadPhoto(title.trim() || 'Sin título', albumId || null, storedUrl, privacy, allowedUserIds);
      
      // Clean state
      setTitle('');
      setPhotoUrl('');
      setSelectedFile(null);
      setAlbumId('');
      setPrivacy('amigos');
      setAllowedUserIds([]);
      setEditState({ ...DEFAULT_EDIT_STATE });
      onClose();
    } catch (err: any) {
      console.error('Error processing image:', err);
      // Fallback with base64
      uploadPhoto(title.trim() || 'Sin título', albumId || null, photoUrl, privacy, allowedUserIds);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-lg border border-gray-300 max-w-3xl w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-100 text-[#3869A0] flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-gray-900 leading-tight">Subir y Publicar Foto en Inkorium</h2>
              <p className="text-[11px] text-gray-500">Selecciona fotos de tu equipo, aplica filtros vintage y guárdalas en tus álbumes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg font-bold cursor-pointer px-1"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Main Photo Picker / Photo Editor Area */}
          {!photoUrl ? (
            <div className="space-y-3">
              <label className="font-bold text-gray-700 block">1. Selecciona la foto que deseas subir desde tu equipo:</label>
              
              {/* Drag and drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition ${
                  isDragOver ? 'border-[#3869A0] bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3869A0] flex items-center justify-center shadow-xs">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">
                      Haz clic para examinar archivos o arrastra una imagen aquí
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Formatos compatibles: JPG, JPEG, PNG, GIF o WEBP</p>
                  </div>
                  <button
                    type="button"
                    className="mt-2 px-4 py-1.5 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded shadow-xs text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Seleccionar desde el ordenador</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* PHOTO EDITOR ACTIVE */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-700 flex items-center gap-1.5 text-xs">
                  <Sliders className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Edición de foto y filtros retro:</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-[#3869A0] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Cambiar imagen</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Editor Controls & Live Canvas */}
              <PhotoEditorControls
                photoUrl={photoUrl}
                editState={editState}
                onChange={setEditState}
              />

              {/* File validation info badge */}
              {selectedFile && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-emerald-50/70 border border-emerald-200 rounded text-[11px] text-emerald-800">
                  <div className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Archivo verificado con éxito: <strong>{selectedFile.name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 text-[10px]">
                    <span className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono">
                      {formatFileSize(selectedFile.size)}
                    </span>
                    {fileValidation?.dimensions && (
                      <span className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono">
                        {fileValidation.dimensions.width} × {fileValidation.dimensions.height} px
                      </span>
                    )}
                    <span className="bg-emerald-100 px-1.5 py-0.5 rounded uppercase font-bold">
                      {selectedFile.type.split('/')[1]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details: Title & Album Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
            {/* Title */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Título o pie de foto:</label>
              <input
                type="text"
                placeholder="Escribe un título para la foto..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#3869A0] bg-white"
              />
            </div>

            {/* Album Selector with Dropdown Menu */}
            <div className="space-y-1.5" ref={albumDropdownRef}>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="album-dropdown-trigger" className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-[#3869A0]" />
                  <span>Álbum de destino:</span>
                  {myAlbums.length > 0 && (
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                      {myAlbums.length} {myAlbums.length === 1 ? 'álbum existente' : 'álbumes existentes'}
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  id="create-album-btn"
                  onClick={() => {
                    setShowNewAlbumInput(!showNewAlbumInput);
                    setIsAlbumDropdownOpen(false);
                  }}
                  className="text-[11px] text-[#3869A0] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <FolderPlus className="w-3 h-3" />
                  <span>{showNewAlbumInput ? 'Cancelar' : 'Crear nuevo álbum'}</span>
                </button>
              </div>

              {/* Inline creator input */}
              {showNewAlbumInput && (
                <div className="flex items-center gap-2 p-2 bg-blue-50/70 rounded-md border border-blue-200 mb-2">
                  <input
                    type="text"
                    id="new-album-input"
                    placeholder="Nombre del nuevo álbum (ej. Fotos de fiesta, Verano 2008)..."
                    value={newAlbumName}
                    onChange={e => setNewAlbumName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateNewAlbum();
                      }
                    }}
                    autoFocus
                    className="flex-1 p-1.5 text-xs bg-white rounded border border-gray-300 focus:outline-none focus:border-[#3869A0]"
                  />
                  <button
                    type="button"
                    id="save-new-album-btn"
                    onClick={handleCreateNewAlbum}
                    disabled={!newAlbumName.trim()}
                    className="px-2.5 py-1 bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold rounded text-xs disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    Guardar
                  </button>
                </div>
              )}

              {/* Custom Interactive Dropdown Menu for Existing Albums */}
              <div className="relative">
                <button
                  type="button"
                  id="album-dropdown-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={isAlbumDropdownOpen}
                  onClick={() => setIsAlbumDropdownOpen(prev => !prev)}
                  className={`w-full p-2 text-xs rounded border text-left flex items-center justify-between transition cursor-pointer bg-white ${
                    isAlbumDropdownOpen
                      ? 'border-[#3869A0] ring-1 ring-[#3869A0] shadow-xs'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {selectedAlbum ? (
                      <>
                        <div className="w-6 h-6 rounded overflow-hidden bg-blue-100 flex-shrink-0 flex items-center justify-center border border-blue-200">
                          {albumDetailsMap.covers[selectedAlbum.id] ? (
                            <img 
                              src={albumDetailsMap.covers[selectedAlbum.id]} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <Folder className="w-3.5 h-3.5 text-[#3869A0]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-gray-900 truncate block">
                            {selectedAlbum.nombre}
                          </span>
                        </div>
                        <span className="bg-blue-100 text-[#3869A0] font-semibold text-[10px] px-1.5 py-0.5 rounded border border-blue-200 flex-shrink-0">
                          {albumDetailsMap.counts[selectedAlbum.id] || 0} fotos
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                          <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-gray-700 truncate block">
                            Ninguno (Fotos subidas sueltas en mi perfil)
                          </span>
                        </div>
                        <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded border border-gray-200 flex-shrink-0">
                          Sin álbum
                        </span>
                      </>
                    )}
                  </div>

                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ml-2 flex-shrink-0 ${
                    isAlbumDropdownOpen ? 'rotate-180 text-[#3869A0]' : ''
                  }`} />
                </button>

                {/* Dropdown Menu Popover Panel */}
                {isAlbumDropdownOpen && (
                  <div 
                    id="album-dropdown-menu"
                    role="listbox"
                    className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg border border-gray-300 shadow-xl z-40 overflow-hidden text-xs animate-fade-in"
                  >
                    {/* Search filter if there are several albums */}
                    {myAlbums.length >= 3 && (
                      <div className="p-2 border-b border-gray-200 bg-gray-50">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
                          <input
                            type="text"
                            placeholder="Buscar entre tus álbumes..."
                            value={albumSearchQuery}
                            onChange={e => setAlbumSearchQuery(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="w-full pl-7 pr-2 py-1 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-[#3869A0]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                      {/* Option 1: None (Loose photos) */}
                      <button
                        type="button"
                        id="album-option-none"
                        role="option"
                        aria-selected={!albumId}
                        onClick={() => {
                          setAlbumId('');
                          setIsAlbumDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-blue-50/60 transition cursor-pointer ${
                          !albumId ? 'bg-blue-50/80 font-bold text-[#3869A0]' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded flex items-center justify-center border flex-shrink-0 ${
                            !albumId ? 'bg-[#3869A0] text-white border-[#3869A0]' : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                            <ImageIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="block truncate text-xs font-semibold">
                              Ninguno (Fotos subidas sueltas)
                            </span>
                            <span className="block text-[10px] text-gray-400 font-normal">
                              La foto se publicará en tu tablón y perfil sin agrupar
                            </span>
                          </div>
                        </div>
                        {!albumId && (
                          <Check className="w-4 h-4 text-[#3869A0] flex-shrink-0 ml-2" />
                        )}
                      </button>

                      {/* Header for Existing Albums */}
                      <div className="bg-gray-50/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-t border-b border-gray-100 flex items-center justify-between">
                        <span>Álbumes existentes ({myAlbums.length})</span>
                        {myAlbums.length > 0 && <span className="text-gray-400 font-normal">Selecciona uno para tu foto</span>}
                      </div>

                      {/* List of Existing Albums */}
                      {filteredAlbums.length > 0 ? (
                        filteredAlbums.map((a) => {
                          const isSelected = albumId === a.id;
                          const photoCount = albumDetailsMap.counts[a.id] || 0;
                          const cover = albumDetailsMap.covers[a.id];

                          return (
                            <button
                              key={a.id}
                              type="button"
                              id={`album-option-${a.id}`}
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setAlbumId(a.id);
                                setIsAlbumDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-blue-50/60 transition cursor-pointer ${
                                isSelected ? 'bg-blue-50/90 font-bold text-[#3869A0]' : 'text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0 relative">
                                  {cover ? (
                                    <img src={cover} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Folder className={`w-4 h-4 ${isSelected ? 'text-[#3869A0]' : 'text-amber-600'}`} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="block truncate text-xs font-bold text-gray-900">
                                    {a.nombre}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-normal">
                                    <span>{photoCount} {photoCount === 1 ? 'foto' : 'fotos'}</span>
                                    {a.fecha && <span>• {a.fecha}</span>}
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#3869A0] flex-shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })
                      ) : myAlbums.length === 0 ? (
                        /* Empty state with instant starter suggestions */
                        <div className="p-3 text-center space-y-2 bg-white">
                          <p className="text-gray-500 text-[11px]">
                            No tienes álbumes creados aún. Puedes crear uno rápido o elegir una sugerencia:
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSelectStarterAlbum('Mis fotos')}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#3869A0] font-semibold rounded border border-blue-200 text-[11px] cursor-pointer"
                            >
                              📸 Mis fotos
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectStarterAlbum('Fotos de fiesta')}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#3869A0] font-semibold rounded border border-blue-200 text-[11px] cursor-pointer"
                            >
                              🎉 Fotos de fiesta
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectStarterAlbum('Verano & Amigos')}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#3869A0] font-semibold rounded border border-blue-200 text-[11px] cursor-pointer"
                            >
                              🌴 Verano & Amigos
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 text-center text-gray-400 text-[11px]">
                          No se encontraron álbumes que coincidan con &quot;{albumSearchQuery}&quot;
                        </div>
                      )}
                    </div>

                    {/* Dropdown Menu Footer Actions */}
                    <div className="p-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">
                        {selectedAlbum ? `Seleccionado: ${selectedAlbum.nombre}` : 'Sin álbum seleccionado'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewAlbumInput(true);
                          setIsAlbumDropdownOpen(false);
                        }}
                        className="text-[11px] text-[#3869A0] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Nuevo álbum</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Accessible native select in background */}
                <select
                  id="album-select-dropdown"
                  name="albumId"
                  value={albumId}
                  onChange={e => setAlbumId(e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <option value="">Ninguno (Fotos subidas sueltas)</option>
                  {myAlbums.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Selected Album Confirmation Badge */}
              {selectedAlbum && (
                <div className="flex items-center justify-between p-1.5 bg-blue-50/70 border border-blue-200 rounded text-[11px] text-blue-900">
                  <div className="flex items-center gap-1.5 truncate">
                    <FolderOpen className="w-3.5 h-3.5 text-[#3869A0] flex-shrink-0" />
                    <span className="truncate">
                      Se subirá a: <strong>{selectedAlbum.nombre}</strong> ({albumDetailsMap.counts[selectedAlbum.id] || 0} fotos existentes)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlbumId('')}
                    title="Quitar asignación de álbum"
                    className="text-gray-400 hover:text-red-600 p-0.5 ml-1 cursor-pointer flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= PRIVACY SETTINGS SECTION ================= */}
          <div className="pt-3 border-t border-gray-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-[#3869A0]" />
                <span>Privacidad de la foto:</span>
              </label>
              <span className="text-[11px] text-gray-500 font-medium">¿Quién puede ver esta foto?</span>
            </div>

            {/* 3 Privacy Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Amigos */}
              <button
                type="button"
                id="privacy-option-amigos"
                onClick={() => setPrivacy('amigos')}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                  privacy === 'amigos'
                    ? 'border-[#3869A0] bg-blue-50/80 ring-1 ring-[#3869A0]'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <Users className={`w-3.5 h-3.5 ${privacy === 'amigos' ? 'text-[#3869A0]' : 'text-gray-500'}`} />
                    <span>Solo amigos</span>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    privacy === 'amigos' ? 'border-[#3869A0] bg-[#3869A0]' : 'border-gray-400 bg-white'
                  }`}>
                    {privacy === 'amigos' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Solo pueden verla tus amigos agregados en Inkorium.
                </p>
              </button>

              {/* Option 2: Pública */}
              <button
                type="button"
                id="privacy-option-publica"
                onClick={() => setPrivacy('publica')}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                  privacy === 'publica'
                    ? 'border-[#3869A0] bg-blue-50/80 ring-1 ring-[#3869A0]'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <Globe className={`w-3.5 h-3.5 ${privacy === 'publica' ? 'text-[#3869A0]' : 'text-gray-500'}`} />
                    <span>Pública</span>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    privacy === 'publica' ? 'border-[#3869A0] bg-[#3869A0]' : 'border-gray-400 bg-white'
                  }`}>
                    {privacy === 'publica' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Cualquier persona dentro de la red podrá verla.
                </p>
              </button>

              {/* Option 3: Elección (Custom) */}
              <button
                type="button"
                id="privacy-option-eleccion"
                onClick={() => setPrivacy('eleccion')}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                  privacy === 'eleccion'
                    ? 'border-[#3869A0] bg-blue-50/80 ring-1 ring-[#3869A0]'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <UserCheck className={`w-3.5 h-3.5 ${privacy === 'eleccion' ? 'text-[#3869A0]' : 'text-gray-500'}`} />
                    <span>Elección</span>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    privacy === 'eleccion' ? 'border-[#3869A0] bg-[#3869A0]' : 'border-gray-400 bg-white'
                  }`}>
                    {privacy === 'eleccion' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Elige qué personas específicas quieres que la vean.
                </p>
              </button>
            </div>

            {/* Sub-Panel for Elección (Friend Picker) */}
            {privacy === 'eleccion' && (
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 space-y-2.5 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-blue-200/70">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                    <Lock className="w-3.5 h-3.5 text-[#3869A0]" />
                    <span>Personas con permiso para ver la foto:</span>
                    <span className="bg-[#3869A0] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {allowedUserIds.length} seleccionada(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllFriends}
                      className="text-[10px] text-[#3869A0] hover:underline font-bold cursor-pointer"
                    >
                      Seleccionar todos
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAllFriends}
                      className="text-[10px] text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
                    >
                      Deseleccionar
                    </button>
                  </div>
                </div>

                {/* Search input for friends */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar amigos por nombre o localidad..."
                    value={friendSearchQuery}
                    onChange={e => setFriendSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:border-[#3869A0]"
                  />
                  {friendSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFriendSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Selected chips row */}
                {allowedUserIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto p-1 bg-white/70 rounded border border-blue-100">
                    {allowedUserIds.map(uid => {
                      const u = users.find(user => user.id === uid);
                      const name = u ? `${u.nombre} ${u.apellidos}`.trim() : 'Usuario';
                      return (
                        <span 
                          key={uid}
                          className="inline-flex items-center gap-1 bg-[#3869A0] text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow-2xs"
                        >
                          {u?.avatar && (
                            <img src={u.avatar} alt="" className="w-3 h-3 rounded-full object-cover" />
                          )}
                          <span className="truncate max-w-[120px]">{name}</span>
                          <button
                            type="button"
                            onClick={() => toggleAllowedUser(uid)}
                            className="hover:bg-white/20 rounded-full p-0.5 cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Friend Checklist List */}
                <div className="max-h-40 overflow-y-auto divide-y divide-gray-100 bg-white rounded border border-gray-200">
                  {filteredFriends.length === 0 ? (
                    <div className="p-3 text-center text-[11px] text-gray-400 italic">
                      No se encontraron amigos con esa búsqueda.
                    </div>
                  ) : (
                    filteredFriends.map(friend => {
                      const isSelected = allowedUserIds.includes(friend.id);
                      const friendName = `${friend.nombre} ${friend.apellidos}`.trim() || friend.nombre;

                      return (
                        <div
                          key={friend.id}
                          onClick={() => toggleAllowedUser(friend.id)}
                          className={`flex items-center justify-between p-2 hover:bg-blue-50/50 cursor-pointer transition ${
                            isSelected ? 'bg-blue-50/70 font-semibold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 border border-gray-300 flex-shrink-0">
                              {friend.avatar ? (
                                <img src={friend.avatar} alt={friendName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-[#3869A0] text-white font-bold text-[10px] flex items-center justify-center">
                                  {friend.nombre.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="truncate">
                              <span className="text-xs text-gray-800 truncate block">{friendName}</span>
                              <span className="text-[10px] text-gray-400 block truncate">
                                {friend.ciudad || friend.provincia || 'Inkorium'}
                              </span>
                            </div>
                          </div>

                          <div className="flex-shrink-0 ml-2">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#3869A0]" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {allowedUserIds.length === 0 && (
                  <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Selecciona al menos a una persona para que pueda ver la foto.</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              {photoUrl ? (
                <>
                  <span className="text-emerald-600 font-bold">✓ Filtro activo:</span>
                  <span className="bg-blue-50 text-[#3869A0] border border-blue-200 px-1.5 py-0.5 rounded font-semibold">
                    {editState.filterId !== 'none' ? editState.filterId.toUpperCase() : 'NORMAL'}
                  </span>
                  {editState.overlayStyle && editState.overlayStyle !== 'none' && (
                    <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-200">
                      Overlay {editState.overlayStyle}
                    </span>
                  )}
                  <span className="hidden sm:inline text-gray-400">• Se aplicará en alta calidad a la foto final</span>
                </>
              ) : (
                'Selecciona una foto para continuar.'
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-3.5 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!photoUrl || isProcessing}
                className="px-5 py-1.5 rounded bg-[#3869A0] hover:bg-[#2c537f] text-white font-bold cursor-pointer shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando y subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir a Inkorium</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};


