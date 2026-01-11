import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Instagram, ExternalLink, Camera, Star, Calendar, ArrowLeft, MapPin, CheckCircle, XCircle, Clock, Edit } from 'lucide-react';
import { membersApi, photosApi, evaluationApi } from '../../services/api';
import { TagBadge, TagBadgeList } from '../ui/TagBadge';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

export const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('photos');

  const isOwnProfile = currentUser?.user_id === userId;
  const isEvaluator = profile?.tags?.some(t => ['avaliador', 'gestao', 'admin', 'lider'].includes(t));

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileRes] = await Promise.all([
        membersApi.get(userId)
      ]);
      setProfile(profileRes.data);

      // Load photos by this user
      try {
        const photosRes = await photosApi.list({ author_id: userId, status: 'approved' });
        setPhotos(photosRes.data || []);
      } catch (e) {
        console.error('Error loading photos:', e);
        setPhotos([]);
      }

      // Load evaluation history if evaluator
      if (profileRes.data?.tags?.some(t => ['avaliador', 'gestao', 'admin', 'lider'].includes(t))) {
        try {
          const historyRes = await evaluationApi.getEvaluatorHistory(userId);
          setEvaluationHistory(historyRes.data || []);
        } catch (e) {
          console.error('Error loading evaluation history:', e);
          setEvaluationHistory([]);
        }
      }
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
        {/* Back button and Edit button */}
        <div className="flex justify-between items-center mb-6">
          <Link to="/membros" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            Voltar para membros
          </Link>
          
          {isOwnProfile && (
            <Link to="/perfil/editar">
              <Button className="bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-2">
                <Edit size={18} />
                Editar Perfil
              </Button>
            </Link>
          )}
        </div>

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

              {/* Social Links - PROMINENT */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                {profile.instagram && (
                  <a
                    href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity shadow-lg"
                  >
                    <Instagram size={20} />
                    <span>{profile.instagram}</span>
                  </a>
                )}
                {profile.jetphotos && (
                  <a
                    href={profile.jetphotos.startsWith('http') ? profile.jetphotos : `https://${profile.jetphotos}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg text-white font-medium hover:opacity-90 transition-opacity shadow-lg"
                  >
                    <ExternalLink size={20} />
                    <span>JetPhotos</span>
                  </a>
                )}
                {!profile.instagram && !profile.jetphotos && (
                  <p className="text-gray-500 italic">Nenhuma rede social configurada</p>
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
              {isEvaluator && (
                <div className="glass-card p-4 col-span-2">
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{evaluationHistory.length}</div>
                  <div className="text-gray-400 text-sm">Avaliações</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs for Photos and Evaluation History */}
        {isEvaluator && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'photos' 
                  ? 'bg-sky-500 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Camera size={16} className="inline mr-2" />
              Fotos Publicadas
            </button>
            <button
              onClick={() => setActiveTab('evaluations')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'evaluations' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <CheckCircle size={16} className="inline mr-2" />
              Histórico de Avaliações
            </button>
          </div>
        )}

        {/* Photos Gallery Tab */}
        {activeTab === 'photos' && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Camera className="text-sky-400" />
              Fotos Publicadas por {profile.name?.split(' ')[0]} ({photos.length})
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
        )}

        {/* Evaluation History Tab (only for evaluators) */}
        {activeTab === 'evaluations' && isEvaluator && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle className="text-green-400" />
              Histórico de Avaliações ({evaluationHistory.length})
            </h2>

            {evaluationHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma avaliação registrada ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evaluationHistory.map((evaluation, index) => (
                  <div 
                    key={evaluation.evaluation_id || index} 
                    className={`p-4 rounded-lg border ${
                      evaluation.result === 'approved' 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : evaluation.result === 'rejected'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Photo thumbnail */}
                      {evaluation.photo_url && (
                        <img
                          src={evaluation.photo_url?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${evaluation.photo_url}` : evaluation.photo_url}
                          alt={evaluation.photo_title}
                          className="w-20 h-16 object-cover rounded"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {evaluation.result === 'approved' ? (
                            <CheckCircle size={18} className="text-green-400" />
                          ) : evaluation.result === 'rejected' ? (
                            <XCircle size={18} className="text-red-400" />
                          ) : (
                            <Clock size={18} className="text-yellow-400" />
                          )}
                          <span className={`font-medium ${
                            evaluation.result === 'approved' ? 'text-green-400' :
                            evaluation.result === 'rejected' ? 'text-red-400' :
                            'text-yellow-400'
                          }`}>
                            {evaluation.result === 'approved' ? 'Aprovada' :
                             evaluation.result === 'rejected' ? 'Recusada' : 'Pendente'}
                          </span>
                        </div>
                        <p className="text-white font-medium">{evaluation.photo_title || 'Foto sem título'}</p>
                        <p className="text-gray-400 text-sm">{evaluation.photo_author}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Nota: ⭐ {evaluation.score?.toFixed(1) || '0.0'}</span>
                          <span>{new Date(evaluation.evaluated_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        {evaluation.comment && (
                          <p className="text-gray-400 text-sm mt-2 italic">"{evaluation.comment}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
