import * as React from "react"
import { Navbar } from "./Navbar"
import { LeftSidebar } from "./LeftSidebar"
import { RightSidebar } from "./RightSidebar"
import { MainContainer } from "./MainContainer"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-main font-sans">
      <Navbar />
      <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 flex gap-6">
        <LeftSidebar />
        <MainContainer>
          {children}
        </MainContainer>
        <RightSidebar />
      </div>
    </div>
  )
}
