import { createFileRoute } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { MiniPlayer } from '../components/music/MiniPlayer'
import { useState } from 'react'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { LoginForm } from '../components/auth/LoginForm'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const { session } = Route.useRouteContext()

  if (!session) {
    return <LoginForm />
  }

  return <Home />
}

function Home() {
  const [showPlayer, setShowPlayer] = useState(false)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Inkorium</CardTitle>
          <CardDescription>
            Visual architecture and component base established successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted mb-4">
            This layout features a robust base inspired by the best of 2000s social networks (Tuenti, MySpace, Fotolog), modernized for 2026. Try toggling the MiniPlayer using the button below.
          </p>
          <Button onClick={() => setShowPlayer(!showPlayer)}>
            {showPlayer ? "Close MiniPlayer" : "Open MiniPlayer"}
          </Button>
        </CardContent>
      </Card>

      {/* Placeholder Feed Post to demonstrate Card styling */}
      <Card>
        <div className="p-4 flex items-center gap-3 border-b border-border bg-surface-hover/50 rounded-t-lg">
          <div className="w-10 h-10 rounded-sm bg-border overflow-hidden">
             <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-full h-full object-cover"/>
          </div>
          <div>
            <h4 className="font-semibold text-sm">Design System</h4>
            <p className="text-xs text-text-muted">Just now</p>
          </div>
        </div>
        <CardContent className="mt-4 pb-4">
          <p className="text-sm">
            Everything is set up using Tailwind CSS v4 and CSS variables. The layout components are fully responsive and structured according to the specifications.
          </p>
          <div className="mt-4 aspect-video bg-surface-hover rounded-sm overflow-hidden border border-border">
             <img src="https://picsum.photos/seed/inkorium/800/400" alt="Placeholder" className="w-full h-full object-cover"/>
          </div>
        </CardContent>
        <div className="px-4 py-3 border-t border-border flex items-center gap-4 text-text-muted">
           <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
              <Heart className="w-4 h-4" /> <span className="text-xs font-medium">124</span>
           </div>
           <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
              <MessageCircle className="w-4 h-4" /> <span className="text-xs font-medium">12</span>
           </div>
           <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors ml-auto">
              <Share2 className="w-4 h-4" />
           </div>
        </div>
      </Card>

      {showPlayer && <MiniPlayer />}
    </div>
  )
}
