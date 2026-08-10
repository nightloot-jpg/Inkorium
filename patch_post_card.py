import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Post Card border radius and padding
    # rounded-xl border border-slate-100 bg-white shadow-sm mb-4
    content = content.replace(
        'rounded-xl border border-slate-100 bg-white shadow-sm mb-4',
        'rounded border border-slate-200 bg-white shadow-none mb-3'
    )

    # Internal spacing
    # px-5 pt-5 -> px-4 pt-4
    content = content.replace('px-5 pt-5', 'px-4 pt-3')
    # px-5 py-4 text-sm -> px-4 py-3 text-sm
    content = content.replace('px-5 py-4 text-sm', 'px-4 py-3 text-sm')
    # px-5 (for photos) -> px-4
    content = content.replace('px-5', 'px-4')

    # "rounded-md" on photos -> "rounded-sm"
    content = content.replace('rounded-md', 'rounded-sm')

    # Comment section spacing
    content = content.replace('px-4 pb-5 pt-2', 'px-4 pb-4 pt-2')

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Patched {filepath}")

if __name__ == "__main__":
    patch_file('src/features/feed/components/PostCard.tsx')
