import React from 'react';
import { Calendar, Star, Clock, Award, BookOpen } from 'lucide-react';
import { memories } from '../../data/mock';

export const MemoriesPage = () => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const highlightedMemories = memories.filter(m => m.highlight);
  const otherMemories = memories.filter(m => !m.highlight);

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="hero-bg py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-2 mb-6">
              <BookOpen size={16} className="text-sky-400" />
              <span className="text-sky-300 text-sm font-medium">Nossas Memórias</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Recordações
            </h1>
            <p className="text-xl text-gray-300">
              Momentos especiais, eventos marcantes e curiosidades da nossa jornada no mundo do spotting.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Memories */}
      <section className="py-24 bg-[#0a1929]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-12">
            <Star className="text-amber-400" size={28} />
            <h2 className="text-3xl font-bold text-white">Momentos Inesquecíveis</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {highlightedMemories.map((memory, index) => (
              <div
                key={memory.id}
                className="relative bg-gradient-to-br from-[#102a43] to-[#0a1929] rounded-2xl p-8 border border-amber-500/20 hover:border-amber-500/40 transition-all hover-lift"
              >
                <div className="absolute top-4 right-4">
                  <Star className="text-amber-400 fill-amber-400" size={24} />
                </div>
                <div className="flex items-center gap-2 text-sky-400 mb-4">
                  <Calendar size={16} />
                  <span className="text-sm font-medium">{formatDate(memory.date)}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{memory.title}</h3>
                <p className="text-gray-300 leading-relaxed">{memory.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Memories */}
      <section className="py-24 bg-[#102a43]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-12">
            <Clock className="text-sky-400" size={28} />
            <h2 className="text-3xl font-bold text-white">Outras Recordações</h2>
          </div>

          <div className="space-y-6">
            {otherMemories.map((memory) => (
              <div
                key={memory.id}
                className="bg-[#0a1929] rounded-xl p-6 border border-[#1a3a5c] hover:border-sky-500/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 text-sky-400">
                    <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">{formatDate(memory.date)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{memory.title}</h3>
                    <p className="text-gray-400">{memory.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add Memory CTA */}
      <section className="py-16 bg-[#0a1929]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="card-navy p-8 md:p-12">
            <h3 className="text-2xl font-bold text-white mb-4">
              Tem uma recordação para compartilhar?
            </h3>
            <p className="text-gray-400 mb-6">
              Entre em contato conosco pelas redes sociais e compartilhe seus momentos especiais 
              com a comunidade Spotters CXJ.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://instagram.com/spotterscxj"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent"
              >
                Compartilhar no Instagram
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
