import sys

def patch_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Import formatTime from components_player
    target = 'import { FloatingMusicPlayer } from "./components_player";'
    new_target = 'import { FloatingMusicPlayer, formatTime } from "./components_player";'

    content = content.replace(target, new_target)

    with open(file_path, 'w') as f:
        f.write(content)

patch_file('src/main.tsx')
