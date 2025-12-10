import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, User, Users, Sparkles, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/profile', icon: User, key: 'profile' },
  { to: '/synastry', icon: Users, key: 'synastry' },
  { to: '/oracle', icon: Sparkles, key: 'oracle' },
  { to: '/settings', icon: Settings, key: 'settings' },
]

export default function Layout() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen bg-void">
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-[72px] bg-void-light border-r border-border flex flex-col items-center py-6 gap-2">
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center mb-6">
          <span className="text-gold font-semibold">V</span>
        </div>
        {navItems.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 relative group',
                isActive ? 'text-gold bg-gold/10' : 'text-muted hover:text-white hover:bg-void-lighter'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gold rounded-r" />}
                <Icon size={22} />
                <span className="absolute left-16 px-2 py-1 bg-void-lighter text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {t(`nav.${key}`)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Main Content */}
      <main className="ml-[72px] flex-1 min-h-screen">
        <div className="max-w-[1200px] mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
