import React, { useState, useEffect } from 'react';
import {
  Trophy, Camera, Calendar, Vote, CheckCircle, Clock, AlertCircle, BarChart2, Image
} from 'lucide-react';
import { rankingApi, eventsApi, API_CONFIG } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Podium } from '../ui/Podium';
import { TagBadgeList } from '../ui/TagBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export const RankingPage = () => {
  const { isAuthenticated } = useAuth();
  const [photoRanking, setPhotoRanking] = useState([]);
  const [userRanking, setUserRanking] = useState([]);
  const [podium, setPodium] = useState([]);
  const [top3Photos, setTop3Photos] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventPermission, setEventPermission] = useState(null);
  const [eventResults, setEventResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votingLoading, setVotingLoading] = useState(false);
  const [votedEvents, setVotedEvents] = useState(new Set());

  const backendOrigin =
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    API_CONFIG?.BACKEND_URL ||
    '';

  const getAssetUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('/api')) return `${backendOrigin}${url}`;
    return url;
  };

  useEffect(() => {
    loadRankings();
    loadEvents();
  }, []);

  useEffect(() => {
    const checkVotedEvents = async () => {
      const voted = new Set();
      for (const event of events) {
        try {
          const res = await eventsApi.checkPermission(event.event_id);
          if (res.data?.has_voted) voted.add(event.event_id);
        } catch {
          // ignore
        }
      }
      setVotedEvents(voted);
    };

    if (isAuthenticated && events.length > 0) checkVotedEvents();
  }, [isAuthenticated, events]);

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

  const loadEvents = async () => {
    try {
      const res = await eventsApi.list(false);
      setEvents(res.data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleSelectEvent = async (event) => {
    setSelectedEvent(event);
    setEventPermission(null);
    setEventResults(null);

    try {
      const permRes = await eventsApi.checkPermission(event.event_id);
      setEventPermission(permRes.data);
    } catch (error) {
      console.error('Error checking permission:', error);
      setEventPermission({ can_vote: false, reason: 'Erro ao verificar permissão' });
    }

    try {
      const resultsRes = await eventsApi.getResults(event.event_id);
      setEventResults(resultsRes.data);
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const handleVote = async (voteData) => {
    if (!selectedEvent) return;

    setVotingLoading(true);
    try {
      await eventsApi.vote(selectedEvent.event_id, voteData);
      toast.success('Voto registrado com sucesso!');

      setVotedEvents(prev => new Set([...prev, selectedEvent.event_id]));

      await handleSelectEvent(selectedEvent);
      await loadEvents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao registrar voto');
    } finally {
      setVotingLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatusBadge = (event) => {
    const status = event.computed_status;
    if (status === 'upcoming') {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
          <Clock size={12} />Em breve
        </span>
      );
    }
    if (status === 'ended') {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
          <CheckCircle size={12} />Encerrado
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
        <Vote size={12} />Em votação
      </span>
    );
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
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Trophy size={16} />
              Fotógrafos
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Camera size={16} />
              Fotos
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar size={16} />
              Eventos
            </TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users">
            <div className="glass-card p-8 mb-8">
              <h2 className="text-xl font-bold text-white text-center mb-6">🏆 Top 3 Fotógrafos</h2>
              <Podium winners={podium} />
            </div>

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
                  {userRanking.map((u, index) => (
                    <tr key={u.user_id} className="hover:bg-white/5 transition-colors">
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
                            src={u.picture || '/logo-spotters-round.png'}
                            alt={u.author_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <span className="text-white font-medium">{u.author_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sky-400 font-semibold">{u.total_photos}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-yellow-400">⭐ {u.average_rating?.toFixed(1) || '0.0'}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <TagBadgeList tags={u.tags} size="small" maxShow={2} />
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

          {/* PHOTOS TAB */}
          <TabsContent value="photos">
            {top3Photos.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {top3Photos.map((photo, index) => (
                  <div key={photo.photo_id} className="glass-card overflow-hidden relative">
                    <div className={`absolute top-3 left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      'bg-amber-700 text-white'
                    }`}>
                      {index + 1}
                    </div>

                    <img
                      src={getAssetUrl(photo.url)}
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
                            src={getAssetUrl(photo.url)}
                            alt={photo.title}
                            className="w-16 h-12 rounded object-cover"
                          />
                          <span className="text-white font-medium line-clamp-1">{photo.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-400">{photo.aircraft_model}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-400">{photo.author_name}</td>
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

          {/* EVENTS TAB */}
          <TabsContent value="events">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar size={20} className="text-sky-400" />
                  Eventos Ativos
                </h2>

                {events.length === 0 ? (
                  <div className="glass-card p-8 text-center">
                    <Calendar size={48} className="mx-auto mb-4 text-gray-500 opacity-50" />
                    <p className="text-gray-400">Nenhum evento ativo no momento</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.event_id}
                      onClick={() => handleSelectEvent(event)}
                      className={`glass-card p-4 cursor-pointer transition-all hover:border-sky-500/50 ${
                        selectedEvent?.event_id === event.event_id ? 'border-sky-500 bg-sky-500/10' : ''
                      } ${votedEvents.has(event.event_id) ? 'border-green-500/30' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{event.title}</h3>
                          {votedEvents.has(event.event_id) && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                              <CheckCircle size={10} />
                              Votou
                            </span>
                          )}
                        </div>
                        {getEventStatusBadge(event)}
                      </div>

                      <p className="text-gray-400 text-sm line-clamp-2 mb-2">{event.description}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          {event.event_type === 'photo' ? <Image size={12} /> : <BarChart2 size={12} />}
                          {event.event_type === 'photo' ? 'Votação de Fotos' : 'Enquete'}
                        </span>
                        <span>{formatDate(event.end_date)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="lg:col-span-2">
                {!selectedEvent ? (
                  <div className="glass-card p-12 text-center">
                    <Vote size={64} className="mx-auto mb-4 text-gray-500 opacity-50" />
                    <h3 className="text-xl text-gray-400 mb-2">Selecione um evento</h3>
                    <p className="text-gray-500">Clique em um evento para ver detalhes e votar</p>
                  </div>
                ) : (
                  <div className="glass-card p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{selectedEvent.title}</h2>
                        <p className="text-gray-400">{selectedEvent.description}</p>
                      </div>
                      {getEventStatusBadge(selectedEvent)}
                    </div>

                    <div className="flex flex-wrap gap-4 mb-6 text-sm">
                      <div className="bg-[#102a43] rounded-lg px-4 py-2">
                        <span className="text-gray-400">Início: </span>
                        <span className="text-white">{formatDate(selectedEvent.start_date)}</span>
                      </div>
                      <div className="bg-[#102a43] rounded-lg px-4 py-2">
                        <span className="text-gray-400">Fim: </span>
                        <span className="text-white">{formatDate(selectedEvent.end_date)}</span>
                      </div>
                      <div className="bg-[#102a43] rounded-lg px-4 py-2">
                        <span className="text-gray-400">Tipo: </span>
                        <span className="text-white">
                          {selectedEvent.event_type === 'photo' ? '📷 Votação de Fotos' : '📊 Enquete'}
                        </span>
                      </div>
                    </div>

                    {!isAuthenticated && selectedEvent.computed_status === 'active' && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 text-blue-400">
                          <AlertCircle size={20} />
                          <span className="font-medium">Faça login para votar</span>
                        </div>
                        <p className="text-blue-200/80 mt-1 text-sm">
                          Você precisa estar logado para participar desta votação.
                        </p>
                      </div>
                    )}

                    {isAuthenticated && eventPermission && !eventPermission.can_vote && !eventPermission.has_voted && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 text-amber-400">
                          <AlertCircle size={20} />
                          <span className="font-medium">Votação restrita</span>
                        </div>
                        <p className="text-amber-200/80 mt-1 text-sm">
                          Você não tem permissão para votar neste evento.
                        </p>
                      </div>
                    )}

                    {eventPermission?.has_voted && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle size={24} className="text-green-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-400 font-semibold">Você já votou neste evento</span>
                              <span className="px-2 py-0.5 bg-green-500/30 text-green-300 text-xs rounded-full">Voto registrado</span>
                            </div>
                            <p className="text-green-200/70 text-sm mt-1">
                              Obrigado por participar! Seu voto foi contabilizado.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedEvent.computed_status === 'active' && eventPermission?.can_vote && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Vote size={18} className="text-sky-400" />
                          Vote agora!
                        </h3>

                        {selectedEvent.event_type === 'photo' ? (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {selectedEvent.photos?.map((photo) => (
                              <div
                                key={photo.photo_id}
                                className="bg-[#0a1929] rounded-lg overflow-hidden border border-[#1a3a5c] hover:border-sky-500/50 transition-all"
                              >
                                <img
                                  src={getAssetUrl(photo.url)}
                                  alt={photo.title}
                                  className="w-full h-40 object-cover"
                                />
                                <div className="p-3">
                                  <h4 className="text-white font-medium text-sm mb-1">{photo.title}</h4>
                                  <p className="text-gray-400 text-xs mb-3">{photo.author_name}</p>
                                  <Button
                                    onClick={() => handleVote({ photo_id: photo.photo_id })}
                                    disabled={votingLoading}
                                    className="w-full btn-accent text-sm"
                                  >
                                    {votingLoading ? 'Votando...' : 'Votar nesta foto'}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedEvent.poll_options?.map((option) => (
                              <button
                                key={option.option_id}
                                onClick={() => handleVote({ option_id: option.option_id })}
                                disabled={votingLoading}
                                className="w-full bg-[#102a43] hover:bg-[#1a3a5c] border border-[#1a3a5c] hover:border-sky-500/50 rounded-lg p-4 text-left transition-all"
                              >
                                <span className="text-white">{option.text}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {eventResults?.results_available && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <BarChart2 size={18} className="text-sky-400" />
                          Resultados
                          <span className="text-sm text-gray-400 font-normal">
                            ({eventResults.total_votes} votos)
                          </span>
                        </h3>

                        {selectedEvent.event_type === 'photo' ? (
                          <div className="space-y-4">
                            {eventResults.results?.map((result, index) => (
                              <div key={result.photo_id} className="bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c]">
                                <div className="flex items-center gap-4">
                                  <span className={`text-2xl font-bold ${
                                    index === 0 ? 'text-yellow-400' :
                                    index === 1 ? 'text-gray-400' :
                                    index === 2 ? 'text-amber-600' :
                                    'text-gray-500'
                                  }`}>
                                    #{index + 1}
                                  </span>
                                  <img
                                    src={getAssetUrl(result.url)}
                                    alt={result.title}
                                    className="w-20 h-14 object-cover rounded"
                                  />
                                  <div className="flex-1">
                                    <h4 className="text-white font-medium">{result.title}</h4>
                                    <p className="text-gray-400 text-sm">{result.author_name}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xl font-bold text-sky-400">{result.votes}</div>
                                    <div className="text-xs text-gray-500">votos</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {eventResults.results?.map((result) => {
                              const percentage = eventResults.total_votes > 0
                                ? Math.round((result.votes / eventResults.total_votes) * 100)
                                : 0;

                              return (
                                <div key={result.option_id} className="bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c]">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-white">{result.text}</span>
                                    <span className="text-sky-400 font-semibold">{result.votes} votos ({percentage}%)</span>
                                  </div>
                                  <div className="h-2 bg-[#1a3a5c] rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all bg-sky-500"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {eventResults && !eventResults.results_available && (
                      <div className="bg-[#102a43] rounded-lg p-6 text-center">
                        <Clock size={32} className="mx-auto mb-3 text-gray-500" />
                        <p className="text-gray-400">{eventResults.message}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RankingPage;
