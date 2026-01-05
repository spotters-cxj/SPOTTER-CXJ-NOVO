import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, Youtube, Plane, User, LogOut, Shield } from 'lucide-react';
import { siteConfig } from '../../data/mock';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

const navLinks = [
  { path: '/', label: 'Início' },
  { path: '/historia-aeroporto', label: 'Aeroporto CXJ' },
  { path: '/historia-spotters', label: 'Spotters CXJ' },
  { path: '/recordacoes', label: 'Recordações' },
  { path: '/galeria', label: 'Galeria' },
  { path: '/informacoes', label: 'Informações' },
];

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, login, logout, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0a1929]/95 backdrop-blur-lg shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={siteConfig.logoSecondary}
                alt="Spotters CXJ"
                className="h-12 w-12 rounded-lg object-contain bg-black/50 p-1 transition-transform group-hover:scale-105"
              />
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-white tracking-wider">SPOTTERS</span>
                <span className="text-xl font-bold text-sky-400 ml-1">CXJ</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link px-4 py-2 text-sm font-medium ${
                    location.pathname === link.path ? 'active' : ''
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side - Social + Auth */}
            <div className="flex items-center gap-4">
              {/* Social Links */}
              <div className="hidden md:flex items-center gap-2">
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-pink-400 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href={siteConfig.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube size={20} />
                </a>
              </div>

              {/* Auth Button */}
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden sm:block text-sm text-gray-300">
                    {user.name}
                  </span>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="border-sky-500/50 text-sky-400 hover:bg-sky-500/10">
                        <Shield size={16} className="mr-1" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="text-gray-400 hover:text-white"
                  >
                    <LogOut size={18} />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={login}
                  className="bg-sky-600 hover:bg-sky-500 text-white"
                  size="sm"
                >
                  <User size={16} className="mr-2" />
                  Entrar
                </Button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu lg:hidden">
          <nav className="flex flex-col items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xl font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-sky-400'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className="text-xl font-medium text-sky-400">
                Painel Admin
              </Link>
            )}
          </nav>
          
          <div className="flex items-center gap-6 mt-8">
            <a
              href={siteConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-400 transition-colors"
            >
              <Instagram size={28} />
            </a>
            <a
              href={siteConfig.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Youtube size={28} />
            </a>
          </div>

          {!user && (
            <Button
              onClick={() => {
                setIsMobileMenuOpen(false);
                login();
              }}
              className="mt-8 bg-sky-600 hover:bg-sky-500 text-white"
            >
              <User size={18} className="mr-2" />
              Entrar com Google
            </Button>
          )}
        </div>
      )}
    </>
  );
};
