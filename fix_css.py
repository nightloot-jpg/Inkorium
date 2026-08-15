import sys
import re

def append_new_css(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    new_css = """
/* NEW INKORIUM YOUTUBE PLAYLIST CSS */
.ink-playlist-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 12px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  font-family: inherit;
}

.ink-playlist-header {
  display: flex;
  gap: 20px;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.ink-playlist-cover-wrapper {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.ink-playlist-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ink-play-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  padding: 0;
}

.ink-playlist-cover-wrapper:hover .ink-play-overlay {
  opacity: 1;
}

.ink-playlist-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.ink-playlist-info {
  margin-bottom: 12px;
}

.ink-playlist-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ink-playlist-artist {
  margin: 0 0 4px 0;
  color: #666;
  font-size: 14px;
}

.ink-playlist-count {
  color: #888;
  font-size: 13px;
  display: block;
}

.ink-playlist-controls {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ink-playlist-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.ink-playlist-progress input[type="range"] {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.ink-playlist-progress input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary, #233B5D);
  cursor: pointer;
  transition: transform 0.1s;
}

.ink-playlist-progress input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.ink-playlist-progress.active input[type="range"] {
  background: linear-gradient(to right, var(--primary, #233B5D) 0%, var(--primary, #233B5D) var(--value, 0%), #e0e0e0 var(--value, 0%), #e0e0e0 100%);
}

.ink-playlist-progress.dummy input[type="range"]::-webkit-slider-thumb {
  background: #ccc;
}

.ink-playlist-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ink-playback-btns {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ink-icon-btn {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  transition: background 0.2s;
}

.ink-icon-btn:hover {
  background: #f0f0f0;
}

.ink-play-pause-btn {
  color: var(--primary, #233B5D);
}

.ink-play-pause-btn:hover {
  background: rgba(35, 59, 93, 0.1);
}

.ink-volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  color: #666;
}

.ink-volume-control input[type="range"] {
  width: 60px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  border-radius: 2px;
  outline: none;
}

.ink-volume-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #888;
  cursor: pointer;
}

.ink-outline-button {
  background: white;
  border: 1px solid var(--primary, #233B5D);
  color: var(--primary, #233B5D);
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.ink-outline-button:hover {
  background: var(--primary, #233B5D);
  color: white;
}

.ink-playlist-tracks {
  display: flex;
  flex-direction: column;
}

.ink-playlist-track {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.2s;
}

.ink-playlist-track:last-child {
  border-bottom: none;
}

.ink-playlist-track:hover {
  background: #fafafa;
}

.ink-playlist-track.active {
  background: rgba(35, 59, 93, 0.08); /* Soft Inkorium blue */
}

.ink-track-number {
  width: 24px;
  text-align: center;
  color: #888;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  justify-content: center;
}

.ink-playlist-track.active .ink-track-number {
  color: var(--primary, #233B5D);
}

.ink-track-details {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.ink-track-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ink-track-artist {
  font-size: 13px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.ink-track-duration {
  font-size: 13px;
  color: #888;
}

.ink-load-more-tracks {
  width: 100%;
  padding: 12px;
  background: #f9f9f9;
  border: none;
  border-top: 1px solid #f0f0f0;
  color: #666;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.ink-load-more-tracks:hover {
  background: #f0f0f0;
  color: #333;
}

@media (max-width: 500px) {
  .ink-playlist-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }
  .ink-playlist-cover-wrapper {
    width: 120px;
    height: 120px;
  }
  .ink-playlist-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .ink-playback-btns {
    justify-content: center;
  }
  .ink-volume-control {
    display: none;
  }
}
"""
    with open(file_path, 'a') as f:
        f.write(new_css)

append_new_css('src/styles.css_append')
