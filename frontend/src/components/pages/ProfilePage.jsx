import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Instagram, ExternalLink, Camera, Star, Calendar, ArrowLeft, MapPin } from 'lucide-react';
import { membersApi, photosApi } from '../../services/api';
import { TagBadge, TagBadgeList } from '../ui/TagBadge';
import { Button } from '../ui/button';

export const ProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, photosRes] = await Promise.all([
        membersApi.get(userId),
        photosApi.list({ author_id: userId, status: 'approved' }).catch(() => ({ data: [] }))
      ]);
      setProfile(profileRes.data);
      setPhotos(photosRes.data || []);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get badge info based on tags
  const getBadgeInfo = (tags) => {
    if (tags?.includes('lider')) return { emoji: '👑', title: 'Líder', color: 'from-yellow-500 to-amber-600' };
    if (tags?.includes('admin')) return { emoji: '🛡️', title: 'Administrador', color: 'from-red-500 to-rose-600' };
    if (tags?.includes('gestao')) return { emoji: '📊', title: 'Gestão', color: 'from-purple-500 to-violet-600' };
    if (tags?.includes('produtor')) return { emoji: '🎬', title: 'Produtor', color: 'from-blue-500 to-cyan-600' };
    if (tags?.includes('avaliador')) return { emoji: '✅', title: 'Avaliador', color: 'from-green-500 to-emerald-600' };
    if (tags?.includes('vip')) return { emoji: '💎', title: 'VIP', color: 'from-amber-400 to-yellow-500' };
    if (tags?.includes('colaborador')) return { emoji: '⭐', title: 'Colaborador', color: 'from-pink-500 to-rose-500' };
    if (tags?.includes('podio')) return { emoji: '🏆', title: 'Pódio', color: 'from-orange-500 to-amber-500' };
    return { emoji: '👤', title: 'Membro', color: 'from-gray-500 to-slate-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-white">Perfil não encontrado</h1>
          <Link to="/membros" className="text-sky-400 hover:underline mt-4 inline-block">← Voltar para membros</Link>
        </div>
      </div>
    );
  }

  const badge = getBadgeInfo(profile.tags);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Back button */}
        <Link to="/membros" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={18} />
          Voltar para membros
        </Link>

        {/* Profile Header */}
        <div className="glass-card p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar with badge */}
            <div className="relative">
              <div className={`w-40 h-40 rounded-full p-1 bg-gradient-to-br ${badge.color}`}>
                <img
                  src={profile.picture || '/logo-spotters-round.png'}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover border-4 border-[#0a1929]"
                />
              </div>
              {/* Badge */}
              <div className={`absolute -bottom-2 -right-2 w-14 h-14 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center border-4 border-[#0a1929] shadow-lg`}>
                <span className="text-2xl">{badge.emoji}</span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">{profile.name}</h1>
              <p className="text-xl text-gray-400 mb-4">{badge.title}</p>
              
              {/* Tags */}
              <div className="mb-6">
                <TagBadgeList tags={profile.tags} size="default" maxShow={10} />
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-300 mb-6 max-w-xl">{profile.bio}</p>
              )}

              {/* Social Links */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                {profile.instagram && (
                  <a
                    href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    <Instagram size={18} />
                    {profile.instagram}
                  </a>
                )}
                {profile.jetphotos && (
                  <a
                    href={profile.jetphotos}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink size={18} />
                    JetPhotos
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="glass-card p-4">
                <Camera className="w-6 h-6 text-sky-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{photos.length}</div>
                <div className="text-gray-400 text-sm">Fotos</div>
              </div>
              <div className="glass-card p-4">
                <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  {photos.length > 0 
                    ? (photos.reduce((sum, p) => sum + (p.public_rating || 0), 0) / photos.length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <div className="text-gray-400 text-sm">Média</div>
              </div>
            </div>
          </div>
        </div>

        {/* Photos Gallery */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Camera className="text-sky-400" />
            Fotos Publicadas ({photos.length})
          </h2>

          {photos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Camera size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhuma foto publicada ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.photo_id} className="group relative overflow-hidden rounded-lg">
                  <img
                    src={photo.url?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${photo.url}` : photo.url}
                    alt={photo.title}
                    className="w-full h-32 object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <h4 className="text-white text-sm font-medium line-clamp-1">{photo.title}</h4>
                    <p className="text-gray-300 text-xs">{photo.aircraft_model}</p>
                    {photo.public_rating > 0 && (
                      <p className="text-yellow-400 text-xs mt-1">⭐ {photo.public_rating?.toFixed(1)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
