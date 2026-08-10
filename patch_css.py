import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Update radii to be smaller
    content = content.replace('--radius-sm: 0.25rem;', '--radius-sm: 2px;')
    content = content.replace('--radius-md: 0.5rem;', '--radius-md: 4px;')
    content = content.replace('--radius-lg: 1rem;', '--radius-lg: 6px;')

    # Soften shadow
    content = content.replace('box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);', 'box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);')

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Patched {filepath}")

if __name__ == "__main__":
    patch_file('src/styles/app.css')
