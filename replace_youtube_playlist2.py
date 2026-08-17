import sys

def replace_component(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Find the start of YoutubePlaylist
    start_str = "function YoutubePlaylist({ media }: { media: any }) {"
    start_idx = content.find(start_str)

    if start_idx == -1:
        print("Could not find start")
        return

    # Find where YoutubePlaylist ends. It is followed by `if (media?.type === "news")` inside the `PostMedia` function.
    # Wait, `YoutubePlaylist` is a top-level component, right above `function PostMedia`.
    end_str = "function PostMedia"
    end_idx = content.find(end_str, start_idx)

    with open('YoutubePlaylist_new.tsx', 'r') as f:
        new_component = f.read()

    new_content = content[:start_idx] + new_component + "\n\n" + content[end_idx:]

    with open(file_path, 'w') as f:
        f.write(new_content)

replace_component('src/main.tsx')
