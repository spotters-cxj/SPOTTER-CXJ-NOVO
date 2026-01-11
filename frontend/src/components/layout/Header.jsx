import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, Youtube, User, LogOut, Shield, Camera, Upload, Trophy, Users, Bell, Newspaper, Search, Sparkles, Home, Image, Award, ChevronDown, UserCircle, Settings, Plane } from 'lucide-react';
import { siteConfig } from '../../data/mock';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { NotificationBell } from '../ui/NotificationBell';

const navLinks = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/noticias', label: 'Notícias', icon: Newspaper },
  { path: '/galeria', label: 'Galeria', icon: Image },
  { path: '/ranking', label: 'Ranking', icon: Trophy },
  { path: '/membros', label: 'Membros', icon: Users },
  { path: '/historia-aeroporto', label: 'Aeroporto', icon: Plane },
  { path: '/informacoes', label: 'Sobre Nós', icon: Users },
  { path: '/creditos', label: 'Créditos', icon: Award },
  { path: '/buscar', label: 'Buscar', icon: Search },
];

const HIERARCHY_LEVELS = {
  lider: 7,
  admin: 6,
  gestao: 5,
  produtor: 4,
  avaliador: 3,
  colaborador: 2,
  spotter_cxj: 1,
  visitante: 0
};

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure YouTube URL is valid
  const youtubeUrl = siteConfig.youtube?.startsWith('http') 
    ? siteConfig.youtube 
    : `https://youtube.com/${siteConfig.youtube || '@spotterscxj'}`;

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
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo - Round */}
            <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
              <img
                src={siteConfig.logoRound}
                alt="Spotters CXJ"
                className="h-12 w-12 rounded-full object-cover border-2 border-sky-500/30 transition-transform group-hover:scale-105"
              />
              <div className="hidden sm:block whitespace-nowrap">
                <span className="text-xl font-bold text-white tracking-wider">SPOTTERS</span>
                <span className="text-xl font-bold text-sky-400 ml-1">CXJ</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link px-3 py-2 text-sm font-medium flex items-center gap-1 ${
                    location.pathname === link.path ? 'active' : ''
                  }`}
                >
                  {link.icon && <link.icon size={14} />}
                  {link.label}
                </Link>
              ))}
              
              {/* VIP Link - Neon outline golden */}
              <Link
                to="/vip"
                className="ml-2 px-4 py-1.5 rounded-lg vip-btn font-bold text-sm flex items-center gap-1"
              >
                <Sparkles size={14} />
                Seja VIP
              </Link>
            </nav>

            {/* Right side - Social + Auth + Mobile Menu */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* User Actions - Desktop only */}
              {user && (
                <div className="hidden lg:flex items-center gap-2">
                  {/* Upload Button */}
                  <Link to="/upload">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-sky-400"
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
                        className="text-gray-400 hover:text-green-400"
                        title="Avaliar Fotos"
                      >
                        <Camera size={18} />
                      </Button>
                    </Link>
                  )}

                  {/* Notifications */}
                  <NotificationBell />
                </div>
              )}

              {/* Social Links - Desktop only */}
              <div className="hidden lg:flex items-center gap-1">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-pink-400 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href={youtubeUrl}
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
                <div className="relative" ref={userMenuRef}>
                  {/* User Button */}
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <img
                      src={user.picture || siteConfig.logoRound}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                    />
                    <span className="text-sm text-gray-300 max-w-24 truncate">
                      {user.name?.split(' ')[0]}
                    </span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#0a1929] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50">
                      {/* User Info */}
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={user.picture || siteConfig.logoRound}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-sky-500/50"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold truncate">{user.name}</p>
                            <p className="text-gray-400 text-xs truncate">{user.email}</p>
                          </div>
                        </div>
                        {user.tags && user.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {user.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-full bg-sky-500/20 text-sky-400">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          to={`/perfil/${user.user_id}`}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <UserCircle size={18} />
                          <span>Meu Perfil</span>
                        </Link>

                        <Link
                          to="/perfil/editar"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <Settings size={18} />
                          <span>Editar Perfil</span>
                        </Link>

                        {isGestao && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sky-400 hover:bg-sky-500/10 transition-colors"
                          >
                            <Shield size={18} />
                            <span>Painel Admin</span>
                          </Link>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="p-2 border-t border-white/10">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut size={18} />
                          <span>Sair da Conta</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  onClick={login}
                  className="hidden lg:flex bg-sky-600 hover:bg-sky-500 text-white"
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

      {/* Mobile Menu - Modern & Beautiful */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute right-0 top-20 bottom-0 w-80 bg-gradient-to-br from-[#0a1929] via-[#102a43] to-[#0a1929] border-l border-white/10 shadow-2xl overflow-y-auto">
            <div className="p-6">
              {/* User Section */}
              {user && (
                <div className="mb-8 glass-card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={user.picture || '/logo-spotters-round.png'}
                      alt={user.name}
                      className="w-12 h-12 rounded-full border-2 border-sky-500/50"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{user.name}</p>
                      <p className="text-gray-400 text-xs truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    to={`/perfil/${user.user_id}`}
                    className="block w-full text-center py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    Ver Perfil
                  </Link>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="space-y-2 mb-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      location.pathname === link.path
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/50'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {link.icon ? (
                      <link.icon size={20} />
                    ) : (
                      <Home size={20} className="opacity-50" />
                    )}
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}
                
                {/* VIP Button */}
                <Link
                  to="/vip"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all"
                >
                  <Sparkles size={20} />
                  <span>Seja VIP</span>
                </Link>
              </nav>

              {/* User Actions */}
              {user && (
                <div className="space-y-2 mb-6 pt-6 border-t border-white/10">
                  <Link
                    to="/upload"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <Upload size={20} />
                    <span className="font-medium">Enviar Foto</span>
                  </Link>
                  
                  {canEvaluate && (
                    <Link
                      to="/avaliacao"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-green-400 hover:bg-green-500/10 transition-all"
                    >
                      <Trophy size={20} />
                      <span className="font-medium">Avaliar Fotos</span>
                    </Link>
                  )}
                  
                  {isGestao && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-all"
                    >
                      <Shield size={20} />
                      <span className="font-medium">Painel Admin</span>
                    </Link>
                  )}
                </div>
              )}

              {/* Social Links */}
              <div className="mb-6 pt-6 border-t border-white/10">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  Redes Sociais
                </p>
                <div className="flex gap-3">
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all"
                  >
                    <Instagram size={20} />
                    <span className="text-sm">Instagram</span>
                  </a>
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all"
                  >
                    <Youtube size={20} />
                    <span className="text-sm">YouTube</span>
                  </a>
                </div>
              </div>

              {/* Auth Actions */}
              {user ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
                >
                  <LogOut size={20} />
                  <span>Sair</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    login();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors"
                >
                  <User size={20} />
                  <span>Entrar com Google</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
