import re

with open('src/styles.css', 'r') as f:
    content = f.read()

# Replace widths and paddings to make it more compact
content = content.replace(
"""/* MINI PLAYER */
.floating-music-player {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 16px;
}""",
"""/* MINI PLAYER */
.floating-music-player {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  gap: 12px;
}"""
)

content = content.replace(
""".floating-player-wrapper.mini {
  width: auto;
  min-width: 380px;
}""",
""".floating-player-wrapper.mini {
  width: auto;
  min-width: 380px;
  max-width: 620px;
}"""
)

content = content.replace(
""".drag-handle, .drag-handle-expanded {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 24px;""",
""".drag-handle, .drag-handle-expanded {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 16px;"""
)


content = content.replace(
""".player-left .info-small strong {
  font-size: 14px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.player-left .info-small span {
  font-size: 12px;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}""",
""".player-left .info-small strong {
  font-size: 13px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.player-left .info-small span {
  font-size: 11px;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}"""
)

content = content.replace(
""".controls-small {
  display: flex;
  align-items: center;
  gap: 12px;
}""",
""".controls-small {
  display: flex;
  align-items: center;
  gap: 6px;
}"""
)

content = content.replace(
""".play-btn-small {
  background: #003f87;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.1s, background 0.2s;
}""",
""".play-btn-small {
  background: #003f87;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.1s, background 0.2s;
}"""
)

content = content.replace(
""".icon-btn {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: color 0.2s, background 0.2s;
}""",
""".icon-btn {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 50%;
  transition: color 0.2s, background 0.2s;
}"""
)

content = content.replace(
""".player-right {
  display: flex;
  align-items: center;
  gap: 8px;
}""",
""".player-right {
  display: flex;
  align-items: center;
  gap: 4px;
}"""
)

content = content.replace(
""".volume-control-small input[type="range"] {
  width: 60px;
  height: 4px;
  -webkit-appearance: none;
  background: var(--border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}""",
""".volume-control-small input[type="range"] {
  width: 48px;
  height: 4px;
  -webkit-appearance: none;
  background: var(--border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}"""
)

content = content.replace(
"""  .floating-music-player {
    flex-wrap: wrap;
    justify-content: center;
  }
  .player-center {
    width: 100%;
    order: 3;
    margin-top: 8px;
  }""",
"""  .floating-music-player {
    padding: 6px 8px;
    gap: 8px;
    flex-wrap: nowrap;
  }
  .player-left {
    min-width: 100px;
  }
  .player-left .info-small strong, .player-left .info-small span {
    max-width: 80px;
  }
  .volume-control-small {
    display: none; /* Hide volume slider on very small screens to save space */
  }"""
)

with open('src/styles.css', 'w') as f:
    f.write(content)
