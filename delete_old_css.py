import sys

def delete_old(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    start_idx = content.find(".post-playlist-card {")
    end_idx = content.find("/* Global Floating Player Styles */")

    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + content[end_idx:]

    with open(file_path, 'w') as f:
        f.write(content)

delete_old('src/styles.css_append')
