import React, { useState, useEffect } from 'react';
import { Instagram, Youtube, ExternalLink, MapPin, Users, Camera, Calendar } from 'lucide-react';
import { leadersApi, settingsApi, statsApi, pagesApi } from '../../services/api';
import { siteConfig } from '../../data/mock';
import { Button } from '../ui/button';

export const GroupInfoPage = () => {
  const [leaders, setLeaders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState({ members: "50+", photos: "5.000+", events: "30+", years: "8+" });
  const [pageContent, setPageContent] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leadersRes, settingsRes, statsRes, pageRes] = await Promise.all([
          leadersApi.list(),
          settingsApi.get(),
          statsApi.get(),
          pagesApi.getPage('group-info')
        ]);
        setLeaders(leadersRes.data);
        setSettings(settingsRes.data);
        setStats(statsRes.data);
        setPageContent(pageRes.data);
      } catch (error) {
        console.error('Error loading group info:', error);
      }
    };
    loadData();
  }, []);

  const content = pageContent || {
    title: "Sobre o Spotters CXJ",
    subtitle: "Conheça nossa comunidade",
    content: "O Spotters CXJ é uma comunidade de entusiastas da aviação dedicados a documentar e compartilhar a paixão por aeronaves."
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="hero-bg py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-2 mb-6">
                <Users size={16} className="text-sky-400" />
                <span className="text-sky-300 text-sm font-medium">Conheça o Grupo</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">{content.title}</h1>
              <p className="text-xl text-gray-300">{content.subtitle}</p>
            </div>
            <div className="flex justify-center">
              <img src={siteConfig.logoMain} alt="Spotters CXJ" className="w-64 h-64 object-contain rounded-2xl bg-black/50 animate-float" />
            </div>
          </div>
        </div>
      </section>

      {/* Content Section - Editável */}
      {content.content && (
        <section className="py-16 bg-[#0a1929]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                {content.content}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 bg-[#102a43]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: stats.members, label: 'Membros Ativos', icon: Users },
              { value: stats.photos, label: 'Fotos Registradas', icon: Camera },
              { value: stats.events, label: 'Eventos', icon: Calendar },
              { value: stats.years, label: 'Anos de História', icon: MapPin }
            ].map((stat, index) => (
              <div key={index} className="stat-card hover-lift">
                <stat.icon className="w-8 h-8 text-sky-400 mx-auto mb-3" />
                <div className="stat-number text-3xl">{stat.value}</div>
                <div className="text-gray-400 text-sm mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaders Section */}
      <section className="py-24 bg-[#0a1929]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Liderança do Grupo</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Conheça os responsáveis pela organização e coordenação do Spotters CXJ
            </p>
          </div>

          {leaders.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {leaders.map((leader) => (
                <div key={leader.leader_id} className="card-navy p-8 text-center hover-lift">
                  <div className="w-24 h-24 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-6 overflow-hidden">
                    {leader.photo_url ? (
                      <img src={leader.photo_url} alt={leader.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-10 h-10 text-sky-400" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{leader.name}</h3>
                  <p className="text-sky-400 font-medium mb-4">{leader.role}</p>
                  {leader.instagram && (
                    <a
                      href={`https://instagram.com/${leader.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors"
                    >
                      <Instagram size={16} />
                      {leader.instagram}
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Liderança será adicionada em breve</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-[#102a43]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Redes Sociais</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Siga-nos nas redes sociais e faça parte da comunidade</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Instagram */}
            <a
              href={settings?.instagram_url || 'https://instagram.com/spotterscxj'}
              target="_blank"
              rel="noopener noreferrer"
              className="card-navy p-8 text-center hover-lift group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Instagram className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Instagram</h3>
              <p className="text-pink-400 font-medium">{settings?.instagram_handle || '@spotterscxj'}</p>
              <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mt-4">
                <span>Acessar</span>
                <ExternalLink size={14} />
              </div>
            </a>

            {/* YouTube */}
            <a
              href={settings?.youtube_url || 'https://youtube.com/@spotterscxj'}
              target="_blank"
              rel="noopener noreferrer"
              className="card-navy p-8 text-center hover-lift group"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Youtube className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">YouTube</h3>
              <p className="text-red-400 font-medium">{settings?.youtube_name || 'Spotters CXJ'}</p>
              <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mt-4">
                <span>Acessar</span>
                <ExternalLink size={14} />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-24 bg-gradient-to-b from-[#0a1929] to-[#102a43]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img src={siteConfig.logoSecondary} alt="Spotters CXJ" className="h-24 w-24 mx-auto rounded-xl bg-black/50 p-2 mb-8" />
          <h2 className="text-3xl font-bold text-white mb-6">Faça Parte do Spotters CXJ</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Quer fazer parte da maior comunidade de spotters de Caxias do Sul?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {settings?.google_form_link ? (
              <a href={settings.google_form_link} target="_blank" rel="noopener noreferrer">
                <Button className="btn-accent w-full sm:w-auto">
                  Faça Parte do Grupo
                  <ExternalLink size={16} className="ml-2" />
                </Button>
              </a>
            ) : (
              <a href={settings?.instagram_url || 'https://instagram.com/spotterscxj'} target="_blank" rel="noopener noreferrer">
                <Button className="btn-accent w-full sm:w-auto">
                  <Instagram size={18} className="mr-2" />
                  Seguir no Instagram
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
