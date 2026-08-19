import re

with open('src/styles.css', 'r') as f:
    content = f.read()

# Replace existing music-layout media query
pattern = r"@media \(max-width: 900px\) \{\n\s*\.music-layout \{.*?\}\n"

new_css = """@media (max-width: 1200px) {
  .music-layout {
    grid-template-columns: 260px 1fr !important;
  }
  .music-sidebar-right {
    display: none !important; /* Hide or move in tablet? Let's just hide or stack */
  }
}
@media (max-width: 900px) {
  .music-layout {
    grid-template-columns: 1fr !important;
  }
  .music-sidebar-right {
    display: flex !important; /* Show again in mobile to stack at bottom */
  }
  .music-sidebar-left { order: -1; }
  .music-main-content { order: 0; }
  .music-sidebar-right { order: 1; }
}
"""

content = re.sub(pattern, new_css, content, flags=re.DOTALL)

# Add min-width: 0 to music-layout elements
if '.music-layout > * {' not in content:
    content += "\n.music-layout > * { min-width: 0; }\n"

with open('src/styles.css', 'w') as f:
    f.write(content)
