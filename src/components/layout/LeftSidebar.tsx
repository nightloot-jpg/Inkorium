import * as React from "react"
import { Home, Users, Image as ImageIcon, Calendar, Settings, Flame } from "lucide-react"
import { cn } from "../../lib/utils"

interface NavItemProps {
  icon: React.ElementType
  label: string
  isActive?: boolean
  badge?: number
}

function NavItem({ icon: Icon, label, isActive, badge }: NavItemProps) {
  return (
    <a
      href="#"
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-text-muted hover:bg-surface hover:text-text-main"
      )}
    >
      <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-text-muted")} />
      <span className="flex-1 text-sm">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-accent-magenta text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </a>
  )
}

export function LeftSidebar() {
  return (
    <aside className="w-[240px] shrink-0 hidden md:block py-6 pr-6">
      <nav className="space-y-1">
        <NavItem icon={Home} label="Feed" isActive />
        <NavItem icon={Users} label="Friends" badge={3} />
        <NavItem icon={ImageIcon} label="Photos" />
        <NavItem icon={Calendar} label="Events" />
        <NavItem icon={Flame} label="Trending" />
      </nav>

      <div className="mt-8 pt-4 border-t border-border">
        <h4 className="px-3 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
          Customization
        </h4>
        <nav className="space-y-1">
          <NavItem icon={Settings} label="Profile Theme" />
        </nav>
      </div>
    </aside>
  )
}
