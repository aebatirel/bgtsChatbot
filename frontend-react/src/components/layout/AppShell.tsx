import { Outlet } from 'react-router'
import { Header } from './Header'
import { GradientBackground } from './GradientBackground'

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <GradientBackground />
      <Header />
      {/* Main content with top padding to account for floating header */}
      <main className="flex-1 flex flex-col pt-20">
        <Outlet />
      </main>
    </div>
  )
}
