import sys

def patch_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Add to interface
    content = content.replace(
        '  duration: number;\n  volume: number;\n',
        '  duration: number;\n  volume: number;\n  seekRequest: number | null;\n  clearSeekRequest: () => void;\n'
    )

    # Add to store initial state
    content = content.replace(
        '  duration: 0,\n  volume: 100,\n',
        '  duration: 0,\n  volume: 100,\n  seekRequest: null,\n'
    )

    # Update seek method and add clearSeekRequest
    content = content.replace(
        '  seek: (time) => set({ currentTime: time }), // Notifies UI, actual seek handled in YT component',
        '  seek: (time) => set({ currentTime: time, seekRequest: time }),\n  clearSeekRequest: () => set({ seekRequest: null }),'
    )

    with open(file_path, 'w') as f:
        f.write(content)

patch_file('src/lib/store.ts')
