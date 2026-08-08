
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar"
import { Badge } from "../ui/Badge"

export function RightSidebar() {
  return (
    <aside className="w-[280px] shrink-0 hidden xl:block py-6 pl-6 space-y-6">
      {/* Online Friends Mini Widget */}
      <div className="rounded-lg border border-border bg-surface p-4 shadow-soft">
        <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
          <span>Online Now</span>
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">12</Badge>
        </h4>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <Avatar shape="square" size="sm" className="border border-border">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${i}`} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-surface bg-green-500" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">User {i}</p>
                <p className="text-xs text-text-muted truncate">Listening to music...</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tuenti-style "Tus fotos" or recent activity */}
      <div className="rounded-lg border border-border bg-surface p-4 shadow-soft">
        <h4 className="text-sm font-semibold mb-3">Recent Photos</h4>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square bg-surface-hover rounded-sm border border-border cursor-pointer hover:border-primary transition-colors overflow-hidden">
               <img src={`https://picsum.photos/seed/${i}/100/100`} alt="Recent" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
