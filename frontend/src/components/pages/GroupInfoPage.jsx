import React from 'react';
import { Instagram, Youtube, Mail, Users, Camera, Calendar, ExternalLink, MapPin } from 'lucide-react';
import { groupInfo, siteConfig } from '../../data/mock';
import { Button } from '../ui/button';

export const GroupInfoPage = () => {
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
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Informações do Grupo
              </h1>
              <p className="text-xl text-gray-300">
                Tudo sobre a comunidade Spotters CXJ e como fazer parte.
              </p>
            </div>
            <div className="flex justify-center">
              <img
                src={siteConfig.logoMain}
                alt="Spotters CXJ"
                className="w-64 h-64 object-contain rounded-2xl bg-black/50 animate-float"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-[#0a1929]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Sobre Nós</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                {groupInfo.about.split('\n').map((paragraph, index) => (
                  paragraph.trim() && <p key={index}>{paragraph.trim()}</p>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: groupInfo.stats.members, label: 'Membros Ativos', icon: Users },
                { value: groupInfo.stats.photos, label: 'Fotos Registradas', icon: Camera },
                { value: groupInfo.stats.events, label: 'Eventos', icon: Calendar },
                { value: groupInfo.stats.years, label: 'Anos de História', icon: MapPin }
              ].map((stat, index) => (
                <div key={index} className="stat-card hover-lift">
                  <stat.icon className="w-8 h-8 text-sky-400 mx-auto mb-3" />
                  <div className="stat-number text-3xl">{stat.value}</div>
                  <div className="text-gray-400 text-sm mt-2">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leaders Section */}
      <section className="py-24 bg-[#102a43]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Liderança do Grupo</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Conheça os responsáveis pela organização e coordenação do Spotters CXJ
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {groupInfo.leaders.map((leader) => (
              <div key={leader.id} className="card-navy p-8 text-center hover-lift">
                <div className="w-24 h-24 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  {leader.photo ? (
                    <img src={leader.photo} alt={leader.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Users className="w-10 h-10 text-sky-400" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{leader.name}</h3>
                <p className="text-sky-400 font-medium mb-4">{leader.role}</p>
                <p className="text-gray-400 text-sm">{leader.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-[#0a1929]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Entre em Contato</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Siga-nos nas redes sociais e faça parte da comunidade
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Instagram */}
            <a
              href={groupInfo.contacts.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="card-navy p-8 text-center hover-lift group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Instagram className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Instagram</h3>
              <p className="text-pink-400 font-medium">{groupInfo.contacts.instagram}</p>
              <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mt-4">
                <span>Acessar</span>
                <ExternalLink size={14} />
              </div>
            </a>

            {/* YouTube */}
            <a
              href={groupInfo.contacts.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="card-navy p-8 text-center hover-lift group"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Youtube className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">YouTube</h3>
              <p className="text-red-400 font-medium">{groupInfo.contacts.youtube}</p>
              <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mt-4">
                <span>Acessar</span>
                <ExternalLink size={14} />
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${groupInfo.contacts.email}`}
              className="card-navy p-8 text-center hover-lift group"
            >
              <div className="w-16 h-16 bg-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Mail className="w-8 h-8 text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">E-mail</h3>
              <p className="text-sky-400 font-medium text-sm break-all">{groupInfo.contacts.email}</p>
              <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mt-4">
                <span>Enviar</span>
                <ExternalLink size={14} />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-24 bg-gradient-to-b from-[#102a43] to-[#0a1929]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img
            src={siteConfig.logoSecondary}
            alt="Spotters CXJ"
            className="h-24 w-24 mx-auto rounded-xl bg-black/50 p-2 mb-8"
          />
          <h2 className="text-3xl font-bold text-white mb-6">
            Faça Parte do Spotters CXJ
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Quer fazer parte da maior comunidade de spotters de Caxias do Sul? 
            Siga-nos nas redes sociais, participe dos nossos eventos e compartilhe 
            sua paixão pela aviação!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={groupInfo.contacts.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="btn-accent w-full sm:w-auto">
                <Instagram size={18} className="mr-2" />
                Seguir no Instagram
              </Button>
            </a>
            <a
              href={groupInfo.contacts.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-white/5">
                <Youtube size={18} className="mr-2" />
                Inscrever no YouTube
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
