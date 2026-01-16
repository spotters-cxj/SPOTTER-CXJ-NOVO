import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, User, LogOut, Shield, Camera, Upload, Bell, Home, Newspaper, Image, Trophy, Users, Plane, Info, Award, Search, ChevronDown, Sparkles, Album } from 'lucide-react';
import { siteConfig } from '../../data/mock';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { NotificationBell } from '../ui/NotificationBell';

// Main navigation links (desktop)
const mainNavLinks = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/noticias', label: 'Notícias', icon: Newspaper },
  { path: '/galeria', label: 'Galeria', icon: Image },
  { path: '/ranking', label: 'Ranking', icon: Trophy },
  { path: '/membros', label: 'Membros', icon: Users },
];

// More menu items (dropdown on desktop, sidebar on mobile)
const moreNavLinks = [
  { path: '/historia-aeroporto', label: 'Aeroporto', icon: Plane },
  { path: '/recordacoes', label: 'Recordações', icon: Album },
  { path: '/informacoes', label: 'Sobre Nós', icon: Info },
  { path: '/historia-spotters', label: 'Créditos', icon: Award },
  { path: '/buscar', label: 'Buscar', icon: Search },
];

// All links for mobile sidebar
const allNavLinks = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/noticias', label: 'Notícias', icon: Newspaper },
  { path: '/galeria', label: 'Galeria', icon: Image },
  { path: '/ranking', label: 'Ranking', icon: Trophy },
  { path: '/membros', label: 'Membros', icon: Users },
  { path: '/historia-aeroporto', label: 'Aeroporto', icon: Plane },
  { path: '/recordacoes', label: 'Recordações', icon: Album },
  { path: '/informacoes', label: 'Sobre Nós', icon: Info },
  { path: '/historia-spotters', label: 'Créditos', icon: Award },
  { path: '/buscar', label: 'Buscar', icon: Search },
];

const HIERARCHY_LEVELS = {
  lider: 7,
  admin: 6,
  gestao: 5,
  produtor: 4,
  avaliador: 3,
  colaborador: 2,
  spotter_cxj: 1
};

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
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
    setIsMoreMenuOpen(false);
  }, [location]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMoreMenuOpen && !e.target.closest('.more-menu-container')) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMoreMenuOpen]);

  const instagramUrl = siteConfig.instagramUrl?.startsWith('http')
    ? siteConfig.instagramUrl
    : `https://instagram.com/${(siteConfig.instagram || 'spotterscxj').replace('@', '')}`;

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
            {/* Logo */}
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
              {mainNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link px-3 py-2 text-sm font-medium flex items-center gap-1.5 ${
                    location.pathname === link.path ? 'active' : ''
                  }`}
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              ))}
              
              {/* More Dropdown */}
              <div className="relative more-menu-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMoreMenuOpen(!isMoreMenuOpen);
                  }}
                  className={`nav-link px-3 py-2 text-sm font-medium flex items-center gap-1.5 ${
                    moreNavLinks.some(l => location.pathname === l.path) ? 'active' : ''
                  }`}
                >
                  Mais
                  <ChevronDown size={14} className={`transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isMoreMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#0d2137] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                    {moreNavLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors ${
                          location.pathname === link.path 
                            ? 'text-sky-400 bg-sky-500/10' 
                            : 'text-gray-300'
                        }`}
                      >
                        <link.icon size={18} />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              {/* VIP Link */}
              <Link
                to="/vip"
                className="ml-2 px-4 py-1.5 rounded-lg vip-btn font-bold text-sm flex items-center gap-1"
              >
                <Sparkles size={14} />
                Seja VIP
              </Link>
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

                  {/* Evaluation Button */}
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

              {/* Instagram Only (removed YouTube) */}
              <div className="hidden md:flex items-center">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-pink-400 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
              </div>

              {/* Auth Button */}
              {user ? (
                <div className="flex items-center gap-2">
                  <Link to={`/perfil/${user.user_id}`} className="hidden sm:flex items-center gap-2">
                    <img
                      src={user.picture || siteConfig.logoRound}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                    />
                    <span className="text-sm text-gray-300 max-w-24 truncate">
                      {user.name?.split(' ')[0]}
                    </span>
                  </Link>
                  {isGestao && (
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
                    className="hidden sm:flex text-gray-400 hover:text-white"
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
                className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Menu"
                data-testid="mobile-menu-toggle"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Menu */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        data-testid="mobile-menu-overlay"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Sidebar */}
        <div 
          className={`absolute top-0 right-0 h-full w-[280px] mobile-sidebar border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          data-testid="mobile-sidebar"
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src={siteConfig.logoRound}
                alt="Spotters CXJ"
                className="h-11 w-11 rounded-full object-cover border-2 border-sky-500/40"
              />
              <div>
                <span className="text-lg font-bold text-white tracking-wide">SPOTTERS</span>
                <span className="text-lg font-bold text-sky-400 ml-1">CXJ</span>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              data-testid="close-mobile-menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {allNavLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`mobile-nav-${link.label.toLowerCase()}`}
                className={`mobile-menu-item ${
                  location.pathname === link.path
                    ? 'active'
                    : 'text-gray-300'
                }`}
              >
                <link.icon size={20} />
                <span>{link.label}</span>
              </Link>
            ))}
            
            {/* VIP Link */}
            <div className="pt-3">
              <Link
                to="/vip"
                data-testid="mobile-nav-vip"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold vip-btn"
              >
                <Sparkles size={20} />
                <span>Seja VIP</span>
              </Link>
            </div>
          </nav>

          {/* User Actions in Sidebar */}
          {user && (
            <div className="px-3 py-2 border-t border-white/10 mt-2">
              <Link 
                to="/upload" 
                data-testid="mobile-nav-upload"
                className="mobile-menu-item text-gray-300"
              >
                <Upload size={20} />
                <span>Enviar Foto</span>
              </Link>
              {canEvaluate && (
                <Link 
                  to="/avaliacao" 
                  data-testid="mobile-nav-avaliacao"
                  className="mobile-menu-item text-green-400"
                >
                  <Camera size={20} />
                  <span>Avaliar Fotos</span>
                </Link>
              )}
              {isGestao && (
                <Link 
                  to="/admin" 
                  data-testid="mobile-nav-admin"
                  className="mobile-menu-item text-sky-400"
                >
                  <Shield size={20} />
                  <span>Painel Admin</span>
                </Link>
              )}
            </div>
          )}

          {/* Bottom Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#071422]">
            {user ? (
              <div className="flex items-center justify-between">
                <Link to={`/perfil/${user.user_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={user.picture || siteConfig.logoRound}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/20 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{user.name}</p>
                    <p className="text-gray-500 text-xs truncate">{user.email}</p>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 flex-shrink-0"
                  data-testid="mobile-logout-btn"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  login();
                }}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white"
                data-testid="mobile-login-btn"
              >
                <User size={18} className="mr-2" />
                Entrar com Google
              </Button>
            )}

            {/* Instagram Link */}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 justify-center mt-4 py-2 text-gray-400 hover:text-pink-400 transition-colors"
              data-testid="mobile-instagram-link"
            >
              <Instagram size={18} />
              <span className="text-sm">@spotterscxj</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
