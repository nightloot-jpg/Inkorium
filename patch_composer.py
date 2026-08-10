import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # rounded-xl border border-slate-100 bg-white shadow-sm mb-4 -> classic style
    content = content.replace(
        'rounded-xl border border-slate-100 bg-white shadow-sm mb-4',
        'rounded border border-slate-200 bg-white shadow-none mb-4'
    )

    # Internal spacing and input style
    # p-5 pb-4 -> p-4 pb-3
    content = content.replace('p-5 pb-4', 'p-4 pb-3')

    # textarea style
    content = content.replace(
        'rounded-lg border border-slate-100 p-4 text-sm text-slate-700 shadow-inner',
        'rounded-sm border border-slate-200 p-3 text-sm text-slate-700 shadow-none'
    )
    # avatar style
    content = content.replace(
        'h-12 w-12 rounded-full',
        'h-10 w-10 rounded-sm'
    )

    # Composer Action (make them more compact)
    content = content.replace(
        'px-2 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50',
        'px-2 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100'
    )

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Patched {filepath}")

if __name__ == "__main__":
    patch_file('src/features/feed/components/PostComposer.tsx')
