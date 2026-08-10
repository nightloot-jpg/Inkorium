import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Navbar fixes
    # "bg-white" to "bg-gradient-to-r from-[#233B5D] to-[#1b2e49] text-white border-0"
    content = content.replace(
        'className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8"',
        'className="sticky top-0 z-50 flex h-[54px] items-center justify-between bg-gradient-to-r from-[#233B5D] to-[#1b2e49] text-white px-4 md:px-8"'
    )
    # text-[#233B5D] to text-white for logo
    content = content.replace(
        'className="text-2xl font-bold tracking-tighter text-[#233B5D]"',
        'className="text-2xl font-bold tracking-tighter text-white"'
    )
    # Search bar fixes
    content = content.replace(
        'className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"',
        'className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"'
    )
    content = content.replace(
        'className="h-10 w-64 rounded-full bg-slate-100 pl-10 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#233B5D]"',
        'className="h-8 w-96 rounded-sm bg-white text-slate-900 pl-10 pr-4 text-sm outline-none border border-transparent focus:border-slate-300"'
    )
    # Right navbar icons (user/logout)
    content = content.replace(
        'className="hidden md:flex items-center gap-2 rounded-full hover:bg-slate-100 px-3 py-1.5 transition"',
        'className="hidden md:flex items-center gap-2 rounded-sm hover:bg-white/10 px-3 py-1.5 transition text-white"'
    )
    content = content.replace(
        'className="rounded-full p-2 text-slate-600 hover:bg-slate-100 transition"',
        'className="rounded-sm p-2 text-white hover:bg-white/10 transition"'
    )

    # Sidebar width updates
    content = content.replace('w-64 shrink-0', 'w-[280px] shrink-0')
    content = content.replace('w-80 shrink-0', 'w-[260px] shrink-0')

    # Gap updates
    content = content.replace('gap-6 p-4 md:p-6', 'gap-4 p-4')

    # NavItem styling fix (Left Sidebar)
    # Make them less "rounded-lg" and more classic Tuenti style, active blue text
    content = content.replace(
        'className="flex items-center justify-between rounded-lg px-3 py-2.5 text-slate-700 transition hover:bg-white hover:shadow-sm [&.active]:bg-white [&.active]:text-[#233B5D] [&.active]:shadow-sm [&.active]:font-semibold"',
        'className="flex items-center justify-between rounded-sm px-2 py-1.5 text-slate-600 transition hover:bg-slate-200 [&.active]:bg-slate-200/50 [&.active]:text-[#233B5D] [&.active]:font-bold text-sm"'
    )

    # Right sidebar Widget styles
    # "rounded-sm border border-slate-100 bg-white p-5 shadow-sm" -> classic
    content = content.replace(
        'className="rounded-sm border border-slate-100 bg-white p-5 shadow-sm"',
        'className="rounded-sm border border-slate-200 bg-white p-4 shadow-none"'
    )
    content = content.replace(
        'className="mb-4 font-bold text-slate-800"',
        'className="mb-3 text-sm font-bold text-slate-700 border-b border-slate-100 pb-2"'
    )

    # Internal list items in widgets (less rounded, less padding)
    content = content.replace(
        'className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition"',
        'className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 -mx-1 rounded-sm transition"'
    )
    # Event widget internal style
    content = content.replace(
        'className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-blue-50 text-blue-600"',
        'className="flex h-10 w-10 flex-col items-center justify-center rounded-sm bg-blue-50 border border-blue-100 text-blue-600"'
    )

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Patched {filepath}")

if __name__ == "__main__":
    patch_file('src/layouts/MainLayout.tsx')
