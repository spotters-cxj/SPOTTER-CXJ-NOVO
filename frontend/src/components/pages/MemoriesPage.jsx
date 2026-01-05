import React, { useState, useEffect } from 'react';
import { Calendar, Star, Clock, Award, BookOpen } from 'lucide-react';
import { memoriesApi } from '../../services/api';

export const MemoriesPage = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMemories = async () => {
      try {
        const res = await memoriesApi.list();
        setMemories(res.data);
      } catch (error) {
        console.error('Error loading memories:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMemories();
  }, []);

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

      {loading ? (
        <section className="py-24 bg-[#0a1929]">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </section>
      ) : memories.length === 0 ? (
        <section className="py-24 bg-[#0a1929]">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400">Nenhuma recordação cadastrada ainda</h3>
            <p className="text-gray-500 mt-2">Em breve compartilharemos nossos momentos especiais</p>
          </div>
        </section>
      ) : (
        <>
          {/* Featured Memories */}
          {highlightedMemories.length > 0 && (
            <section className="py-24 bg-[#0a1929]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 mb-12">
                  <Star className="text-amber-400" size={28} />
                  <h2 className="text-3xl font-bold text-white">Momentos Inesquecíveis</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {highlightedMemories.map((memory) => (
                    <div
                      key={memory.memory_id}
                      className={`relative bg-gradient-to-br from-[#102a43] to-[#0a1929] rounded-2xl overflow-hidden border border-amber-500/20 hover:border-amber-500/40 transition-all hover-lift ${
                        memory.image_url ? 'flex' : ''
                      } ${memory.layout === 'right' ? 'flex-row-reverse' : ''}`}
                    >
                      {memory.image_url && (
                        <div className="w-1/3 flex-shrink-0">
                          <img src={memory.image_url} alt={memory.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-8 flex-1">
                        <div className="absolute top-4 right-4">
                          <Star className="text-amber-400 fill-amber-400" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">{memory.title}</h3>
                        <p className="text-gray-300 leading-relaxed">{memory.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Other Memories */}
          {otherMemories.length > 0 && (
            <section className="py-24 bg-[#102a43]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 mb-12">
                  <Clock className="text-sky-400" size={28} />
                  <h2 className="text-3xl font-bold text-white">Outras Recordações</h2>
                </div>

                <div className="space-y-6">
                  {otherMemories.map((memory) => (
                    <div
                      key={memory.memory_id}
                      className={`bg-[#0a1929] rounded-xl overflow-hidden border border-[#1a3a5c] hover:border-sky-500/30 transition-all ${
                        memory.image_url ? 'flex' : ''
                      } ${memory.layout === 'right' ? 'flex-row-reverse' : ''}`}
                    >
                      {memory.image_url && (
                        <div className="w-48 flex-shrink-0">
                          <img src={memory.image_url} alt={memory.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-6 flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                            <Award className="w-5 h-5 text-sky-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-white">{memory.title}</h3>
                        </div>
                        <p className="text-gray-400">{memory.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* CTA */}
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
            <a
              href="https://instagram.com/spotterscxj"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent inline-block"
            >
              Compartilhar no Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
