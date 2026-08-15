import sys

def patch_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # We need to add the new useEffect.
    effect_code = """
  useEffect(() => {
     if (isReady && playerRef.current && playerState.seekRequest !== null) {
         playerRef.current.seekTo(playerState.seekRequest, true);
         playerState.clearSeekRequest();
     }
  }, [playerState.seekRequest, isReady]);
"""
    # Insert it right before: useEffect(() => { if (isReady && playerRef.current) { playerRef.current.setVolume(playerState.volume); } }, [playerState.volume, isReady]);
    target = "  useEffect(() => {\n     if (isReady && playerRef.current) {\n         playerRef.current.setVolume(playerState.volume);"

    if target in content:
        content = content.replace(target, effect_code + '\n' + target)
    else:
        print("Could not find target to insert effect")

    # In FloatingMusicPlayer's local inputs, we can keep the current logic:
    # playerState.seek(t);
    # if (playerRef.current) playerRef.current.seekTo(t, true);
    # Because playerState.seek(t) will set seekRequest, our effect will run and see seekRequest != null,
    # and might call seekTo again, but that's fine.
    # To be cleaner, we can remove the explicit seekTo in FloatingMusicPlayer so it only relies on the effect,
    # but the instructions didn't mandate it and it's safer. Let's just remove the explicit seekTo from FloatingMusicPlayer.

    content = content.replace(
        "playerState.seek(t);\n                  if (playerRef.current) playerRef.current.seekTo(t, true);",
        "playerState.seek(t);"
    )
    content = content.replace(
        "playerState.seek(t);\n                if (playerRef.current) playerRef.current.seekTo(t, true);",
        "playerState.seek(t);"
    )


    with open(file_path, 'w') as f:
        f.write(content)

patch_file('src/components_player.tsx')
