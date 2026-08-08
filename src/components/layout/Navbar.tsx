
import { Logo } from "../ui/Logo"
import { SearchInput } from "../ui/SearchInput"
import { IconButton } from "../ui/IconButton"
import { Music, Bell, MessageSquare, Menu } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar"

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4 max-w-[1280px]">
        {/* Left section: Logo */}
        <div className="flex items-center gap-4 w-[240px] shrink-0">
          <IconButton variant="ghost" className="md:hidden">
            <Menu className="h-5 w-5" />
          </IconButton>
          <Logo />
        </div>

        {/* Center section: Search */}
        <div className="flex-1 max-w-xl hidden md:flex items-center">
          <SearchInput className="w-full" />
        </div>

        {/* Right section: Actions & Profile */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <IconButton variant="ghost">
            <Music className="h-5 w-5" />
          </IconButton>
          <IconButton variant="ghost">
            <MessageSquare className="h-5 w-5" />
          </IconButton>
          <IconButton variant="ghost">
            <Bell className="h-5 w-5" />
          </IconButton>
          <div className="h-8 w-px bg-border mx-1 hidden sm:block" />
          <Avatar shape="square" size="sm" className="cursor-pointer border border-border">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
