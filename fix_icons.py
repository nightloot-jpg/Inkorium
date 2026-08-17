import re

with open('src/components_player.tsx', 'r') as f:
    content = f.read()

# Make the Play/Pause and other icons slightly smaller to match the compact design
content = content.replace('<Play size={20}', '<Play size={16}')
content = content.replace('<Pause size={20}', '<Pause size={16}')
content = content.replace('<SkipBack size={20}', '<SkipBack size={16}')
content = content.replace('<SkipForward size={20}', '<SkipForward size={16}')
content = content.replace('<Maximize2 size={20}', '<Maximize2 size={16}')
content = content.replace('<X size={20}', '<X size={16}')

with open('src/components_player.tsx', 'w') as f:
    f.write(content)
