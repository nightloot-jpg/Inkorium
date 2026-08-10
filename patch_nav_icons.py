import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Change text-slate-400 group-hover:text-[#233B5D] to just smaller sizes
    content = content.replace(
        'size={20} className="text-slate-400 group-hover:text-[#233B5D]"',
        'size={16} className="text-slate-500"'
    )

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Patched {filepath}")

if __name__ == "__main__":
    patch_file('src/layouts/MainLayout.tsx')
