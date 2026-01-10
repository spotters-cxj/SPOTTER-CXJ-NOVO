import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plane, Camera, Users, Calendar, ArrowRight, ExternalLink, Trophy, Star } from 'lucide-react';
import { siteConfig } from '../../data/mock';
import { pagesApi, settingsApi, galleryApi, statsApi, rankingApi } from '../../services/api';
import { Button } from '../ui/button';
import { NewsCarousel } from '../ui/NewsCarousel';
import { CollaboratorCarousel } from '../ui/CollaboratorCarousel';
import { Podium } from '../ui/Podium';

export const HomePage = () => {
  const [pageContent, setPageContent] = useState(null);
  const [settings, setSettings] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState({ members: "50+", photos: "5.000+", events: "30+", years: "8+" });
  const [podium, setPodium] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pageRes, settingsRes, photosRes, statsRes, podiumRes] = await Promise.all([
          pagesApi.getPage('home'),
          settingsApi.get(),
          galleryApi.list({}),
          statsApi.get(),
          rankingApi.getPodium().catch(() => ({ data: { winners: [] } }))
        ]);
        setPageContent(pageRes.data);
        setSettings(settingsRes.data);
        setPhotos(photosRes.data.slice(0, 6));
        setStats(statsRes.data);
        setPodium(podiumRes.data?.winners || []);
      } catch (error) {
        console.error('Error loading home data:', error);
      }
    };
    loadData();
  }, []);

  const content = pageContent || {
    title: "Bem-vindo ao Spotters CXJ",
    subtitle: "A comunidade de entusiastas da aviação em Caxias do Sul",
    content: "O Spotters CXJ é um grupo apaixonado por aviação..."
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a1929] to-black" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-sky-500/3 to-transparent rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-2 mb-6">
                <Plane size={16} className="text-sky-400" />
                <span className="text-sky-300 text-sm font-medium">Aviação em Caxias do Sul</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Bem-vindo ao
                <br />
                <span className="text-spotters-hero">
                  <span className="text-outlined-wine">Spotters CXJ</span>
                  <Plane 
                    className="airplane-crossing text-[#722f37]" 
                    size={32}
                    strokeWidth={2.5}
                  />
                </span>
              </h1>
              
              <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {content.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/galeria">
                  <Button className="btn-accent w-full sm:w-auto">
                    <Camera size={18} className="mr-2" />
                    Ver Galeria
                  </Button>
                </Link>
                <Link to="/ranking">
                  <Button variant="outline" className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-white/5">
                    <Trophy size={18} className="mr-2" />
                    Ranking
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full scale-110" />
                <img
                  src={siteConfig.logoMain}
                  alt="Spotters CXJ"
                  className="relative w-72 h-72 lg:w-96 lg:h-96 object-contain rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-500 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-sky-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* News Carousel */}
      <NewsCarousel />

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-b from-black to-[#0a1929]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: stats.members, label: 'Membros Ativos', icon: Users },
              { value: stats.photos, label: 'Fotos Registradas', icon: Camera },
              { value: stats.events, label: 'Eventos Realizados', icon: Calendar },
              { value: stats.years, label: 'Anos de História', icon: Plane },
            ].map((stat, index) => (
              <div key={index} className="glass-card p-6 text-center hover-lift">
                <stat.icon className="w-8 h-8 text-sky-400 mx-auto mb-3" />
                <div className="stat-number text-3xl">{stat.value}</div>
                <div className="text-gray-400 text-sm mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-24 bg-[#0a1929]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Galeria de <span className="text-sky-400">Fotos</span>
              </h2>
              <p className="text-gray-400">Os melhores registros da nossa comunidade</p>
            </div>
            <Link to="/galeria">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-white/5">
                Ver Todas
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.length > 0 ? photos.map((photo) => (
              <div key={photo.photo_id} className="photo-card group">
                <img 
                  src={photo.url?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${photo.url}` : photo.url} 
                  alt={photo.description} 
                />
                <div className="photo-overlay">
                  <h3 className="text-white font-semibold mb-1">{photo.aircraft_model}</h3>
                  <p className="text-gray-300 text-sm">{photo.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sky-400 text-xs">Por {photo.author_name}</p>
                    {photo.public_rating > 0 && (
                      <span className="text-yellow-400 text-xs flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        {photo.public_rating?.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-3 text-center py-12">
                <Camera className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Nenhuma foto na galeria ainda</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Collaborators Carousel */}
      <CollaboratorCarousel />

      {/* Ranking Preview */}
      {podium.length > 0 && (
        <section className="py-24 bg-gradient-to-b from-black to-[#0a1929]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                <span className="gradient-text-gold">Top 3</span> Fotógrafos
              </h2>
              <p className="text-gray-400">Os melhores da comunidade Spotters CXJ</p>
            </div>
            
            <div className="glass-card p-8">
              <Podium winners={podium} />
            </div>
            
            <div className="text-center mt-8">
              <Link to="/ranking">
                <Button variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
                  <Trophy size={18} className="mr-2" />
                  Ver Ranking Completo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-24 bg-[#0a1929]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Sobre o <span className="text-sky-400">Spotters CXJ</span>
              </h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                {content.content?.split('\n').map((paragraph, index) => (
                  paragraph.trim() && <p key={index}>{paragraph.trim()}</p>
                ))}
              </div>
            </div>
            
            <div className="glass-card p-8">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Camera className="text-sky-400" />
                Nossos Objetivos
              </h3>
              <ul className="space-y-4">
                {[
                  "Documentar as operações aéreas no Aeroporto CXJ",
                  "Preservar a história da aviação em Caxias do Sul",
                  "Unir entusiastas da aviação da região",
                  "Compartilhar fotografias e conhecimentos",
                  "Promover o spotting como hobby"
                ].map((objective, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-sky-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ChevronRight size={14} className="text-sky-400" />
                    </span>
                    <span className="text-gray-300">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Join CTA Section */}
      <section className="py-24 bg-gradient-to-b from-[#0a1929] to-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6">
            <img
              src={siteConfig.logoRound}
              alt="Spotters CXJ"
              className="h-24 w-24 mx-auto rounded-full border-4 border-sky-500/30"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Faça Parte da Nossa Comunidade
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Junte-se aos entusiastas da aviação em Caxias do Sul. Compartilhe suas fotos, 
            participe dos nossos eventos e faça parte da história do spotting na Serra Gaúcha.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {settings?.google_form_link ? (
              <a
                href={settings.google_form_link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent inline-flex items-center justify-center gap-2"
              >
                Faça Parte do Grupo
                <ExternalLink size={16} />
              </a>
            ) : (
              <a
                href={settings?.instagram_url || 'https://instagram.com/spotterscxj'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent inline-flex items-center justify-center gap-2"
              >
                Siga no Instagram
              </a>
            )}
            <Link to="/informacoes" className="btn-primary inline-flex items-center justify-center">
              Conheça o Grupo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
