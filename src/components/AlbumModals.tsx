import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

// Modal to Create an Album
export function CreateAlbumModal({ session, onClose, onSuccess }: { session: Session; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setLoading(true);
    const { error: dbError } = await supabase
      .from('photo_albums')
      .insert({
        user_id: session.user.id,
        name: name.trim(),
        description: description.trim()
      });

    setLoading(false);
    if (dbError) {
      setError("Error al crear el álbum");
    } else {
      onSuccess();
      onClose();
    }
  }

  return (
    <div className="photos-albums-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="photos-albums-modal-content">
        <div className="photos-albums-modal-header">
          <h2>Crear nuevo álbum</h2>
          <button onClick={onClose} className="photos-albums-close-btn"><X size={24} /></button>
        </div>
        <div className="photos-albums-modal-body">
          {error && <p className="photos-albums-error">{error}</p>}
          <div className="photos-albums-form-group">
            <label>Nombre del álbum</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Viajes 2026" />
          </div>
          <div className="photos-albums-form-group">
            <label>Descripción (opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Añade una descripción..." />
          </div>
        </div>
        <div className="photos-albums-modal-footer">
          <button className="photos-albums-btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="photos-albums-btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? "Creando..." : "Crear álbum"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal to Edit an Album
export function EditAlbumModal({ session, album, onClose, onSuccess }: { session: Session; album: any; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(album.name || "");
  const [description, setDescription] = useState(album.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpdate() {
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setLoading(true);
    const { error: dbError } = await supabase
      .from('photo_albums')
      .update({
        name: name.trim(),
        description: description.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', album.id)
      .eq('user_id', session.user.id);

    setLoading(false);
    if (dbError) {
      setError("Error al actualizar el álbum");
    } else {
      onSuccess();
      onClose();
    }
  }

  return (
    <div className="photos-albums-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="photos-albums-modal-content">
        <div className="photos-albums-modal-header">
          <h2>Editar álbum</h2>
          <button onClick={onClose} className="photos-albums-close-btn"><X size={24} /></button>
        </div>
        <div className="photos-albums-modal-body">
          {error && <p className="photos-albums-error">{error}</p>}
          <div className="photos-albums-form-group">
            <label>Nombre del álbum</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="photos-albums-form-group">
            <label>Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="photos-albums-modal-footer">
          <button className="photos-albums-btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="photos-albums-btn-primary" onClick={handleUpdate} disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal to Add Photos to an Album
export function AddPhotosModal({ session, albumId, onClose, onSuccess }: { session: Session; albumId: string; onClose: () => void; onSuccess: () => void }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadUserPhotos() {
      // Load photos belonging to user that are NOT already in this album
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) {
        // Filter out photos already in the current album
        const availablePhotos = data.filter(p => p.album_id !== albumId);
        setPhotos(availablePhotos);
      }
      setLoading(false);
    }
    loadUserPhotos();
  }, [session.user.id, albumId]);

  function toggleSelection(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  }

  async function handleAdd() {
    if (selectedIds.size === 0) return;
    setSaving(true);
    const idsToUpdate = Array.from(selectedIds);

    // Supabase update with IN operator
    const { error } = await supabase
      .from('photos')
      .update({ album_id: albumId, updated_at: new Date().toISOString() })
      .in('id', idsToUpdate)
      .eq('user_id', session.user.id);

    setSaving(false);
    if (!error) {
      onSuccess();
      onClose();
    } else {
      console.error("Error adding photos to album", error);
    }
  }

  return (
    <div className="photos-albums-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="photos-albums-modal-content photos-albums-modal-large">
        <div className="photos-albums-modal-header">
          <h2>Añadir fotos al álbum</h2>
          <button onClick={onClose} className="photos-albums-close-btn"><X size={24} /></button>
        </div>
        <div className="photos-albums-modal-body photos-albums-selector-body">
          {loading ? (
            <p>Cargando tus fotos...</p>
          ) : photos.length === 0 ? (
            <p className="photos-albums-empty-msg">No tienes más fotos disponibles para añadir.</p>
          ) : (
            <div className="photos-albums-grid-selector">
              {photos.map(photo => {
                const isSelected = selectedIds.has(photo.id);
                return (
                  <div
                    key={photo.id}
                    className={`photos-albums-selectable-photo ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(photo.id)}
                  >
                    <img src={photo.url} alt="thumbnail" />
                    {isSelected && <div className="photos-albums-check"><Check size={16} /></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="photos-albums-modal-footer">
          <div className="photos-albums-selection-count">
            {selectedIds.size} seleccionadas
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="photos-albums-btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="photos-albums-btn-primary" onClick={handleAdd} disabled={saving || selectedIds.size === 0}>
              {saving ? "Añadiendo..." : "Añadir seleccionadas"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
