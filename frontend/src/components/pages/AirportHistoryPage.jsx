import React, { useState, useEffect } from 'react';
import { MapPin, Plane, Calendar, Ruler, Mountain } from 'lucide-react';
import { pagesApi, timelineApi } from '../../services/api';

export const AirportHistoryPage = () => {
  const [pageContent, setPageContent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const specs = {
    icao: "SBCX",
    iata: "CXJ",
    elevation: "2.472 pés (754 m)",
    runway: "1.950 m x 45 m",
    location: "Caxias do Sul, RS - Brasil"
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pageRes, timelineRes] = await Promise.all([
          pagesApi.getPage('airport-history'),
          timelineApi.getAirport()
        ]);
        setPageContent(pageRes.data);
        setTimeline(timelineRes.data);
      } catch (error) {
        console.error('Error loading airport history:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const content = pageContent || {
    title: "História do Aeroporto CXJ",
    subtitle: "Aeroporto Hugo Cantergiani - O portal aéreo da Serra Gaúcha",
    content: "O Aeroporto Hugo Cantergiani, conhecido pelo código IATA CXJ, é o principal aeroporto de Caxias do Sul e da região da Serra Gaúcha."
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="hero-bg py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-2 mb-6">
              <Plane size={16} className="text-sky-400" />
              <span className="text-sky-300 text-sm font-medium">SBCX / CXJ</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              {content.title}
            </h1>
            <p className="text-xl text-gray-300">
              {content.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Specs Cards */}
      <section className="py-12 bg-[#102a43]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Código ICAO', value: specs.icao, icon: Plane },
              { label: 'Código IATA', value: specs.iata, icon: Plane },
              { label: 'Elevação', value: specs.elevation, icon: Mountain },
              { label: 'Pista', value: specs.runway, icon: Ruler },
              { label: 'Localização', value: 'Caxias do Sul, RS', icon: MapPin },
            ].map((spec, index) => (
              <div key={index} className="bg-[#0a1929] rounded-xl p-4 border border-[#1a3a5c] text-center">
                <spec.icon className="w-6 h-6 text-sky-400 mx-auto mb-2" />
                <p className="text-xs text-gray-400 mb-1">{spec.label}</p>
                <p className="text-white font-semibold text-sm">{spec.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 bg-[#0a1929]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Main Content */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Sobre o Aeroporto</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                {content.content?.split('\n').map((paragraph, index) => (
                  paragraph.trim() && <p key={index}>{paragraph.trim()}</p>
                ))}
              </div>
              
              <div className="mt-12 p-6 bg-[#102a43] rounded-xl border border-[#1a3a5c]">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="text-sky-400" size={20} />
                  Informações Técnicas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Pista Principal</p>
                    <p className="text-white font-medium">{specs.runway}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Elevação</p>
                    <p className="text-white font-medium">{specs.elevation}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Orientação</p>
                    <p className="text-white font-medium">18/36</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Superfície</p>
                    <p className="text-white font-medium">Asfalto</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                <Calendar className="text-sky-400" />
                Linha do Tempo
              </h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-8">
                  {timeline.map((item, index) => (
                    <div key={item.item_id || index} className="timeline-item">
                      <div className="bg-[#102a43] rounded-xl p-6 border border-[#1a3a5c] hover:border-sky-500/30 transition-colors">
                        <span className="inline-block bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                          {item.year}
                        </span>
                        <p className="text-gray-200">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
