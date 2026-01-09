import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, Youtube, User, LogOut, Shield, Camera, Upload, Trophy, Users, Bell, Newspaper } from 'lucide-react';
import { siteConfig } from '../../data/mock';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { NotificationBell } from '../ui/NotificationBell';

const navLinks = [
  { path: '/', label: 'Início' },
  { path: '/noticias', label: 'Notícias' },
  { path: '/galeria', label: 'Galeria' },
  { path: '/ranking', label: 'Ranking' },
  { path: '/membros', label: 'Membros' },
  { path: '/historia-aeroporto', label: 'Aeroporto' },
  { path: '/informacoes', label: 'Sobre' },
];

const HIERARCHY_LEVELS = {
  lider: 7,
  admin: 6,
  gestao: 5,
  produtor: 4,
  avaliador: 3,
  colaborador: 2,
  membro: 1
};

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, login, logout, isAdmin, isGestao } = useAuth();

  const getUserLevel = () => {
    if (!user?.tags) return 0;
    return Math.max(...user.tags.map(t => HIERARCHY_LEVELS[t] || 0));
  };

  const canEvaluate = getUserLevel() >= HIERARCHY_LEVELS.avaliador;

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
            ? 'bg-black/90 backdrop-blur-lg shadow-lg border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo - Round */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={siteConfig.logoRound}
                alt="Spotters CXJ"
                className="h-12 w-12 rounded-full object-cover border-2 border-sky-500/30 transition-transform group-hover:scale-105"
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
                  className={`nav-link px-3 py-2 text-sm font-medium ${
                    location.pathname === link.path ? 'active' : ''
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side - Social + Auth */}
            <div className="flex items-center gap-3">
              {/* User Actions */}
              {user && (
                <>
                  {/* Upload Button */}
                  <Link to="/upload">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden sm:flex text-gray-400 hover:text-sky-400"
                    >
                      <Upload size={18} />
                    </Button>
                  </Link>

                  {/* Evaluation Button (for avaliador+) */}
                  {canEvaluate && (
                    <Link to="/avaliacao">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hidden sm:flex text-gray-400 hover:text-green-400"
                        title="Avaliar Fotos"
                      >
                        <Camera size={18} />
                      </Button>
                    </Link>
                  )}

                  {/* Notifications */}
                  <NotificationBell />
                </>
              )}

              {/* Social Links */}
              <div className="hidden md:flex items-center gap-1">
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-pink-400 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href={siteConfig.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube size={18} />
                </a>
              </div>

              {/* Auth Button */}
              {user ? (
                <div className="flex items-center gap-2">
                  <Link to="/perfil" className="hidden sm:flex items-center gap-2">
                    <img
                      src={user.picture || siteConfig.logoRound}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                    />
                    <span className="text-sm text-gray-300 max-w-24 truncate">
                      {user.name?.split(' ')[0]}
                    </span>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="ghost" size="sm" className="text-sky-400 hover:text-sky-300">
                        <Shield size={16} />
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
            
            {user && (
              <>
                <Link to="/upload" className="text-xl font-medium text-gray-300 hover:text-white">
                  Enviar Foto
                </Link>
                {canEvaluate && (
                  <Link to="/avaliacao" className="text-xl font-medium text-green-400">
                    Avaliar Fotos
                  </Link>
                )}
              </>
            )}
            
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
