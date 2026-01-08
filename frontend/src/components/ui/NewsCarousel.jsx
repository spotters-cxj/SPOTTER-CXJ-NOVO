import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const NewsCarousel = ({ news = [] }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(news.length / itemsPerPage);

  React.useEffect(() => {
    if (news.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalPages);
    }, 5000);

    return () => clearInterval(interval);
  }, [news.length, totalPages]);

  const visibleNews = news.slice(
    currentIndex * itemsPerPage,
    currentIndex * itemsPerPage + itemsPerPage
  );

  if (news.length === 0) return null;

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleNews.map((item) => (
          <div
            key={item.id}
            className="glass-card glass-card-hover overflow-hidden cursor-pointer"
          >
            {item.image && (
              <div className="aspect-video">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <span className="text-xs text-gray-500">
                {new Date(item.date).toLocaleDateString('pt-BR')}
              </span>
              <h3 className="text-white font-semibold mt-1 line-clamp-2">
                {item.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? 'bg-sky-400' : 'bg-white/20'
              }`}
            />
          ))}
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % totalPages)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export const NewsTicker = ({ news = [] }) => {
  if (news.length === 0) return null;

  // Duplicate for seamless loop
  const duplicatedNews = [...news, ...news];

  return (
    <div className="news-ticker bg-white/5 py-3 border-y border-white/10">
      <div className="news-ticker-content">
        {duplicatedNews.map((item, index) => (
          <span key={index} className="mx-8 text-gray-300 whitespace-nowrap">
            <span className="text-sky-400 font-semibold">•</span>
            <span className="ml-2">{item.title}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
