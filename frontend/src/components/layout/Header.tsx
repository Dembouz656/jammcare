import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Menu, X, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { Button } from '../ui/button.js';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: '/' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold">
            JC
          </div>
          <span className="font-bold text-lg hidden sm:inline">JammCare</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/services" className="text-sm font-medium hover:text-blue-600 transition">
            Services
          </Link>
          <Link to="/providers" className="text-sm font-medium hover:text-blue-600 transition">
            Providers
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/bookings" className="text-sm font-medium hover:text-blue-600 transition">
                Bookings
              </Link>
            </>
          )}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate({ to: '/profile' })}
                >
                  <User className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate({ to: '/login' })}
              >
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => navigate({ to: '/register' })}
              >
                Register
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-gray-50 p-4">
          <nav className="flex flex-col gap-3">
            <Link to="/services" className="text-sm font-medium hover:text-blue-600 transition">
              Services
            </Link>
            <Link to="/providers" className="text-sm font-medium hover:text-blue-600 transition">
              Providers
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/bookings" className="text-sm font-medium hover:text-blue-600 transition">
                  Bookings
                </Link>
                <Link to="/profile" className="text-sm font-medium hover:text-blue-600 transition">
                  Profile
                </Link>
                <Button size="sm" variant="outline" onClick={handleLogout} className="w-full">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => navigate({ to: '/login' })} className="w-full">
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate({ to: '/register' })} className="w-full">
                  Register
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
