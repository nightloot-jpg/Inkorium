import re
import sys

def process_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Match the entire YoutubePlaylist function
    pattern = re.compile(r'function YoutubePlaylist\([^)]*\)\s*{.*?\n}\n\n', re.DOTALL)

    if not pattern.search(content):
        print("Could not find YoutubePlaylist function to replace.")
        return False

    # Replace it with an import statement (if not already there)
    new_content = pattern.sub('', content)

    if "import { YoutubePlaylist } from './YoutubePlaylist';" not in new_content:
        # Add import after the last import
        import_pattern = re.compile(r'(import .*?\n)(?!(import))', re.DOTALL)
        match = import_pattern.search(new_content)
        if match:
            new_content = new_content[:match.end()] + "import { YoutubePlaylist } from './YoutubePlaylist';\n" + new_content[match.end():]
        else:
            new_content = "import { YoutubePlaylist } from './YoutubePlaylist';\n" + new_content

    with open(filename, 'w') as f:
        f.write(new_content)

    print("Successfully removed YoutubePlaylist from " + filename)
    return True

if __name__ == "__main__":
    process_file("src/main.tsx")
