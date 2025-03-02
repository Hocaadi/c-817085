import { NavLink } from 'react-router-dom';
import { BarChart3, Home, LineChart, Bell, User, Wallet, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Wallet Balances",
    href: "/wallet-balances",
    icon: Wallet,
  },
  {
    title: "Positions",
    href: "/positions",
    icon: LineChart,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
];

function Sidebar() {
  return (
    <div className="w-64 border-r border-secondary/20 h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold">Crypto Hub</h1>
      </div>
      <nav className="space-y-1 px-4">
        {links.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-secondary/10"
              )
            }
          >
            <link.icon className="w-4 h-4" />
            {link.title}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export { Sidebar, links };
export default Sidebar; 