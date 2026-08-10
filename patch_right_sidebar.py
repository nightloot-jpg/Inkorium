import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Right sidebar spacing adjustments for density
    content = content.replace('space-y-6', 'space-y-4')

    with open(filepath, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    patch_file('src/layouts/MainLayout.tsx')
