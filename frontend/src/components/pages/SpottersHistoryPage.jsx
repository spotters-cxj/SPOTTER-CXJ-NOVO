import React from 'react';
import { Camera, Users, Award, Calendar, Star, Heart } from 'lucide-react';
import { spottersHistory, siteConfig } from '../../data/mock';

export const SpottersHistoryPage = () => {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="hero-bg py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-2 mb-6">
                <Users size={16} className="text-sky-400" />
                <span className="text-sky-300 text-sm font-medium">Nossa História</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                {spottersHistory.title}
              </h1>
              <p className="text-xl text-gray-300">
                {spottersHistory.subtitle}
              </p>
            </div>
            <div className="flex justify-center">
              <img
                src={siteConfig.logoSecondary}
                alt="Spotters CXJ"
                className="w-64 h-64 object-contain rounded-2xl bg-black/50 p-4 animate-float"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 bg-[#0a1929]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-6">Como Tudo Começou</h2>
            <div className="space-y-4 text-gray-300 leading-relaxed text-lg">
              {spottersHistory.content.split('\n').map((paragraph, index) => (
                paragraph.trim() && <p key={index}>{paragraph.trim()}</p>
              ))}
            </div>
          </div>

          {/* Values */}
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {[
              {
                icon: Camera,
                title: 'Paixão por Fotografar',
                description: 'Cada aeronave é única e merece ser registrada com dedicação e técnica.'
              },
              {
                icon: Heart,
                title: 'Amor pela Aviação',
                description: 'Compartilhamos o fascinío pelo mundo aéreo e suas histórias.'
              },
              {
                icon: Users,
                title: 'Comunidade Unida',
                description: 'Juntos somos mais fortes. Apoio mútuo é nosso diferencial.'
              }
            ].map((value, index) => (
              <div key={index} className="card-navy p-8 text-center hover-lift">
                <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-sky-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section className="py-24 bg-[#102a43]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Marcos Importantes</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Os momentos que definiram a trajetória dos Spotters CXJ
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spottersHistory.milestones.map((milestone, index) => (
              <div
                key={index}
                className="bg-[#0a1929] rounded-xl p-6 border border-[#1a3a5c] hover:border-sky-500/30 transition-all hover-lift"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-sky-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-7 h-7 text-sky-400" />
                  </div>
                  <div>
                    <span className="text-sky-400 font-bold text-lg">{milestone.year}</span>
                    <h3 className="text-white font-semibold text-lg mt-1 mb-2">{milestone.title}</h3>
                    <p className="text-gray-400 text-sm">{milestone.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-24 bg-[#0a1929]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-6xl text-sky-500/20">
              “
            </div>
            <blockquote className="text-2xl sm:text-3xl text-gray-200 italic leading-relaxed">
              O spotting vai além de fotografar aviões. É sobre contar histórias, 
              preservar memórias e compartilhar paixões com pessoas que entendem 
              o fascinío de ver uma aeronave cortando o céu.
            </blockquote>
            <p className="text-sky-400 mt-6 font-semibold">Spotters CXJ</p>
          </div>
        </div>
      </section>
    </div>
  );
};
