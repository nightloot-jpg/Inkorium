import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # ensure gap-4 instead of gap-6 in mainlayout for denser feel
    content = content.replace('gap-6 p-4 md:p-6', 'gap-4 p-4 md:p-4')
    content = content.replace('gap-6', 'gap-4')

    with open(filepath, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    patch_file('src/layouts/MainLayout.tsx')
