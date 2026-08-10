import sys

def patch_feed_route():
    filepath = 'src/routes/_protected.feed.tsx'
    with open(filepath, 'r') as f:
        content = f.read()

    # Add an Inklog section right above the PostComposer in the feed
    if 'InklogPreview' not in content:
        content = content.replace(
            "import { useFeed } from '../features/feed/hooks/useFeed';",
            "import { useFeed } from '../features/feed/hooks/useFeed';\nimport { Link } from '@tanstack/react-router';"
        )
        # Mock an inklog preview right above PostComposer
        inklog_preview = """
      <div className="mb-4 bg-white border border-slate-200 rounded p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-slate-800">Inklog</h2>
          <Link to="/inklog" className="text-xs text-blue-600 hover:underline">Ver todos los Inklogs →</Link>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
            <Link key={i} to="/inklog" className="aspect-square bg-slate-100 hover:opacity-80 transition block border border-slate-200">
               <img src={`https://picsum.photos/seed/${i+50}/200`} alt="" className="w-full h-full object-cover" />
            </Link>
          ))}
        </div>
      </div>
"""
        content = content.replace(
            '<PostComposer',
            inklog_preview + '      <PostComposer'
        )
    with open(filepath, 'w') as f:
        f.write(content)


def patch_inklog_list():
    filepath = 'src/features/inklog/components/InklogList.tsx'
    with open(filepath, 'r') as f:
        content = f.read()

    # Convert masonry to grid
    content = content.replace(
        'className="columns-1 sm:columns-2 gap-4"',
        'className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"'
    )
    content = content.replace('className="contents"', '')

    with open(filepath, 'w') as f:
        f.write(content)


def patch_inklog_card():
    filepath = 'src/features/inklog/components/InklogCard.tsx'
    with open(filepath, 'r') as f:
        content = f.read()

    content = content.replace(
        'rounded-xl border border-slate-100 bg-white shadow-sm break-inside-avoid mb-4',
        'rounded border border-slate-200 bg-white shadow-none'
    )
    with open(filepath, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    patch_feed_route()
    patch_inklog_list()
    patch_inklog_card()
    print("Patched inklog.")
