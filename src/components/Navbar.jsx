import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/recipes', label: 'Recipe Library' },
  { to: '/inventory', label: 'Inventory' },
];

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="text-xl font-bold text-emerald-700">
          SmartPantry
        </div>

        <div className="flex gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-700 hover:bg-emerald-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}