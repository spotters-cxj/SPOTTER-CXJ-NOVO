import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { newsApi, resolveImageUrl } from '../../services/api';

export const NewsCarousel = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const response = await newsApi.list(10);
      setNews(response.data || []);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || news.length === 0) {
    return null;
  }

  // Duplicate for seamless loop
  const duplicatedNews = [...news, ...news];

  return (
    <section className="py-8 bg-gradient-to-r from-black via-gray-900 to-black overflow-hidden border-t border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Últimas Notícias
        </h3>
      </div>
      
      <div className="news-ticker">
        <div className="news-ticker-content">
          {duplicatedNews.map((item, index) => (
            <div
              key={`${item.news_id}-${index}`}
              className="inline-flex items-center mx-4 min-w-[350px] max-w-[400px] bg-white/5 backdrop-blur rounded-lg overflow-hidden border border-white/10 hover:border-sky-500/30 transition-colors cursor-pointer"
            >
              {item.image && (
                <img
                  src={resolveImageUrl(item.image)}
                  alt={item.title}
                  className="w-24 h-20 object-cover flex-shrink-0"
                />
              )}
              <div className="p-3 flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm line-clamp-1">{item.title}</h4>
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{item.content?.substring(0, 80)}...</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  {item.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      {item.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsCarousel;
