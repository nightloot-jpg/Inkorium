import sys

def process_file(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()

    out_lines = []
    in_target_block = False

    for i, line in enumerate(lines):
        if 'if (media?.type === "youtube_video" || media?.type === "youtube_song") {' in line:
            in_target_block = True
            out_lines.append(line)
            out_lines.append('        return <SingleSongPlayer media={media} />;\n')
            continue

        if in_target_block:
            if '    }' in line and 'return <YoutubePlaylist media={media} />;' in "".join(lines[i:i+4]):
                 # We found the end of the previous block
                 pass

            if line.strip() == '}':
                # look ahead slightly to make sure it's the block
                if i+2 < len(lines) and 'if (media?.type === "youtube_playlist")' in lines[i+2]:
                    in_target_block = False
                    out_lines.append(line)
                    continue
            continue

        if not in_target_block:
            out_lines.append(line)

    with open(file_path, 'w') as f:
        f.writelines(out_lines)

if __name__ == '__main__':
    process_file('src/main.tsx')
