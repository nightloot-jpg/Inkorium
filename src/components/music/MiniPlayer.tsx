
import { Play, SkipBack, SkipForward, X } from "lucide-react"
import { IconButton } from "../ui/IconButton"

export function MiniPlayer() {
  return (
    <div className="fixed bottom-6 right-6 w-80 bg-surface border border-border shadow-soft rounded-lg overflow-hidden z-50">
      {/* MiniPlayer Header (MySpace vibe) */}
      <div className="bg-surface-hover border-b border-border px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-magenta animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Inkorium Player</span>
        </div>
        <IconButton variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-border">
          <X className="h-3 w-3" />
        </IconButton>
      </div>

      {/* MiniPlayer Content */}
      <div className="p-4 flex gap-4">
        {/* Cover Art (Square) */}
        <div className="w-16 h-16 shrink-0 bg-surface-hover border border-border rounded-sm overflow-hidden">
          <img src="https://picsum.photos/seed/music/200/200" alt="Album Art" className="w-full h-full object-cover" />
        </div>

        {/* Track Info & Controls */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h5 className="text-sm font-semibold truncate text-text-main">Welcome to 2026</h5>
            <p className="text-xs text-text-muted truncate">The Nostalgia Project</p>
          </div>

          <div className="flex items-center gap-1 -ml-2">
            <IconButton variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-main">
              <SkipBack className="h-4 w-4" />
            </IconButton>
            <IconButton variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary-hover hover:bg-primary/10">
              <Play className="h-5 w-5" />
            </IconButton>
            <IconButton variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-main">
              <SkipForward className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-surface-hover relative cursor-pointer">
        <div className="absolute top-0 left-0 h-full bg-primary w-1/3" />
      </div>
    </div>
  )
}
