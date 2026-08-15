import sys
import re

def replace_component(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Find the start and end of YoutubePlaylist
    start_str = "function YoutubePlaylist({ media }: { media: any }) {"
    start_idx = content.find(start_str)
    if start_idx == -1:
        print("Could not find YoutubePlaylist")
        return

    # Find the matching closing brace. We know it's followed by `if (media?.type === "news")` or `function YoutubeSong`
    # Let's search for `function PollView` or something below it if we need to.
    # We can just use regex or simple brace counting.
    brace_count = 0
    end_idx = -1
    in_component = False

    for i in range(start_idx, len(content)):
        if content[i] == '{':
            brace_count += 1
            in_component = True
        elif content[i] == '}':
            brace_count -= 1

        if in_component and brace_count == 0:
            end_idx = i
            break

    if end_idx == -1:
        print("Could not find end of YoutubePlaylist")
        return

    with open('YoutubePlaylist_new.tsx', 'r') as f:
        new_component = f.read()

    new_content = content[:start_idx] + new_component + content[end_idx + 1:]

    with open(file_path, 'w') as f:
        f.write(new_content)

replace_component('src/main.tsx')
