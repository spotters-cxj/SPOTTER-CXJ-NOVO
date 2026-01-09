import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, User, ChevronRight, ArrowLeft } from 'lucide-react';
import { newsApi } from '../../services/api';
import { Button } from '../ui/button';
import { Link, useParams, useNavigate } from 'react-router-dom';

export const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { newsId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadNews();
  }, [newsId]);

  const loadNews = async () => {
    try {
      setLoading(true);
      if (newsId) {
        const response = await newsApi.get(newsId);
        setNews([response.data]);
      } else {
        const response = await newsApi.list(50);
        setNews(response.data || []);
      }
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Single news view
  if (newsId && news.length === 1) {
    const article = news[0];
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate('/noticias')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Voltar para notícias
          </button>

          {article.image && (
            <img
              src={article.image.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${article.image}` : article.image}
              alt={article.title}
              className="w-full h-64 md:h-96 object-cover rounded-xl mb-6"
            />
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8 pb-6 border-b border-white/10">
            <span className="flex items-center gap-2">
              <Calendar size={16} className="text-sky-400" />
              {new Date(article.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {article.location && (
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-sky-400" />
                {article.location}
              </span>
            )}
            <span className="flex items-center gap-2">
              <User size={16} className="text-sky-400" />
              {article.author_name}
            </span>
          </div>

          <div className="prose prose-invert max-w-none">
            {article.content?.split('\n').map((paragraph, index) => (
              paragraph.trim() && (
                <p key={index} className="text-gray-300 leading-relaxed mb-4">
                  {paragraph.trim()}
                </p>
              )
            ))}
          </div>

          {article.references && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-2">Referências</h3>
              <p className="text-gray-400 text-sm">{article.references}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // News list
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            <span className="gradient-text">Notícias</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Fique por dentro das últimas novidades da aviação e do Spotters CXJ
          </p>
        </div>

        {news.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Nenhuma notícia publicada ainda</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Featured news */}
            {news[0] && (
              <Link
                to={`/noticias/${news[0].news_id}`}
                className="glass-card glass-card-hover overflow-hidden group"
              >
                <div className="grid md:grid-cols-2 gap-0">
                  {news[0].image && (
                    <img
                      src={news[0].image.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${news[0].image}` : news[0].image}
                      alt={news[0].title}
                      className="w-full h-64 md:h-80 object-cover"
                    />
                  )}
                  <div className="p-8 flex flex-col justify-center">
                    <span className="text-sky-400 text-sm font-medium mb-2">DESTAQUE</span>
                    <h2 className="text-2xl font-bold text-white mb-4 group-hover:text-sky-400 transition-colors">
                      {news[0].title}
                    </h2>
                    <p className="text-gray-400 line-clamp-3 mb-4">
                      {news[0].content?.substring(0, 200)}...
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(news[0].created_at).toLocaleDateString('pt-BR')}
                      </span>
                      {news[0].location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {news[0].location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Other news */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.slice(1).map((article) => (
                <Link
                  key={article.news_id}
                  to={`/noticias/${article.news_id}`}
                  className="glass-card glass-card-hover overflow-hidden group"
                >
                  {article.image && (
                    <img
                      src={article.image.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${article.image}` : article.image}
                      alt={article.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-sky-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {article.content?.substring(0, 120)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(article.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <ChevronRight size={16} className="text-sky-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
