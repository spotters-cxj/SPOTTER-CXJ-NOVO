import React, { useState, useEffect } from 'react';
import { Trophy, Camera, Star, Medal, TrendingUp } from 'lucide-react';
import { rankingApi } from '../../services/api';
import { Podium } from '../ui/Podium';
import { StarRatingDisplay } from '../ui/StarRating';
import { TagBadgeList } from '../ui/TagBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export const RankingPage = () => {
  const [photoRanking, setPhotoRanking] = useState([]);
  const [userRanking, setUserRanking] = useState([]);
  const [podium, setPodium] = useState([]);
  const [top3Photos, setTop3Photos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      setLoading(true);
      const [photosRes, usersRes, podiumRes, top3Res] = await Promise.all([
        rankingApi.getPhotos(50),
        rankingApi.getUsers(50),
        rankingApi.getPodium(),
        rankingApi.getTop3()
      ]);
      setPhotoRanking(photosRes.data || []);
      setUserRanking(usersRes.data || []);
      setPodium(podiumRes.data?.winners || []);
      setTop3Photos(top3Res.data || []);
    } catch (error) {
      console.error('Error loading rankings:', error);
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

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            <span className="gradient-text-gold">Ranking</span> & Competição
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Os melhores fotógrafos e fotos da comunidade Spotters CXJ
          </p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Trophy size={16} />
              Fotógrafos
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Camera size={16} />
              Fotos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            {/* Podium */}
            <div className="glass-card p-8 mb-8">
              <h2 className="text-xl font-bold text-white text-center mb-6">🏆 Top 3 Fotógrafos</h2>
              <Podium winners={podium} />
            </div>

            {/* Full ranking */}
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fotógrafo</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Fotos</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Média</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden sm:table-cell">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {userRanking.map((user, index) => (
                    <tr key={user.user_id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-amber-600' :
                          'text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.picture || '/logo-spotters-round.png'}
                            alt={user.author_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <span className="text-white font-medium">{user.author_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sky-400 font-semibold">{user.total_photos}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-yellow-400">⭐ {user.average_rating?.toFixed(1) || '0.0'}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <TagBadgeList tags={user.tags} size="small" maxShow={2} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {userRanking.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhum ranking disponível ainda</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="photos">
            {/* Top 3 Photos */}
            {top3Photos.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {top3Photos.map((photo, index) => (
                  <div
                    key={photo.photo_id}
                    className="glass-card overflow-hidden relative"
                  >
                    <div className={`absolute top-3 left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      'bg-amber-700 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <img
                      src={photo.url?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${photo.url}` : photo.url}
                      alt={photo.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-white font-semibold">{photo.title}</h3>
                      <p className="text-gray-400 text-sm">{photo.aircraft_model}</p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-gray-500 text-sm">{photo.author_name}</span>
                        <span className="text-yellow-400">⭐ {photo.public_rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Photo list */}
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Foto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden md:table-cell">Aeronave</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden sm:table-cell">Autor</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Avaliação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {photoRanking.map((photo, index) => (
                    <tr key={photo.photo_id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`font-bold ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-amber-600' :
                          'text-gray-500'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={photo.url?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${photo.url}` : photo.url}
                            alt={photo.title}
                            className="w-16 h-12 rounded object-cover"
                          />
                          <span className="text-white font-medium line-clamp-1">{photo.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-400">
                        {photo.aircraft_model}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-400">
                        {photo.author_name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-yellow-400">⭐ {photo.public_rating?.toFixed(1) || '0.0'}</span>
                        <span className="text-gray-500 text-xs ml-1">({photo.public_rating_count || 0})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {photoRanking.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Camera size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhuma foto avaliada ainda</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RankingPage;
