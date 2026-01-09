import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, Check, X, Trash2, Shield, Camera, Settings, RefreshCw, Plus, Edit, Save, Image, FileText, UserCheck, UserX, Crown, Clock, BarChart3, Calendar, History, Search, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi, leadersApi, pagesApi, settingsApi, memoriesApi, galleryApi, timelineApi, statsApi, logsApi } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';

export const AdminPage = () => {
  const { user, isAdmin, isAdminPrincipal } = useAuth();
  const [users, setUsers] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [memories, setMemories] = useState([]);
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({});
  const [airportTimeline, setAirportTimeline] = useState([]);
  const [spottersMilestones, setSpottersMilestones] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [logStats, setLogStats] = useState({});
  const [logFilters, setLogFilters] = useState({ action: '', entity_type: '', admin_id: '' });
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showPageModal, setShowPageModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null);
  const [editingMemory, setEditingMemory] = useState(null);
  const [editingPage, setEditingPage] = useState(null);
  const [editingTimeline, setEditingTimeline] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);

  // Form states
  const [leaderForm, setLeaderForm] = useState({ name: '', role: '', instagram: '', photo_url: '', order: 0 });
  const [memoryForm, setMemoryForm] = useState({ title: '', content: '', image_url: '', layout: 'left', order: 0, highlight: false });
  const [pageForm, setPageForm] = useState({ title: '', subtitle: '', content: '' });
  const [settingsForm, setSettingsForm] = useState({});
  const [statsForm, setStatsForm] = useState({ members: '', photos: '', events: '', years: '' });
  const [timelineForm, setTimelineForm] = useState({ year: '', description: '', order: 0 });
  const [milestoneForm, setMilestoneForm] = useState({ year: '', title: '', description: '', order: 0 });

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, leadersRes, photosRes, memoriesRes, settingsRes, statsRes, airportRes, spottersRes, logsRes, logStatsRes] = await Promise.all([
        adminApi.getUsers(),
        leadersApi.list(),
        galleryApi.list({}),
        memoriesApi.list(),
        settingsApi.get(),
        statsApi.get(),
        timelineApi.getAirport(),
        timelineApi.getSpotters(),
        logsApi.list({ limit: 50 }).catch(() => ({ data: { logs: [] } })),
        logsApi.getStats().catch(() => ({ data: {} }))
      ]);
      setUsers(usersRes.data);
      setLeaders(leadersRes.data);
      setPhotos(photosRes.data);
      setMemories(memoriesRes.data);
      setSettings(settingsRes.data);
      setSettingsForm(settingsRes.data);
      setStats(statsRes.data);
      setStatsForm(statsRes.data);
      setAirportTimeline(airportRes.data);
      setSpottersMilestones(spottersRes.data);
      setAuditLogs(logsRes.data?.logs || []);
      setLogStats(logStatsRes.data || {});
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // User management
  const handleApproveUser = async (userId) => {
    try {
      await adminApi.approveUser(userId, true);
      toast.success('Usuário aprovado');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao aprovar usuário');
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      await adminApi.approveUser(userId, false);
      toast.success('Usuário rejeitado');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao rejeitar usuário');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await adminApi.deleteUser(userId);
      toast.success('Usuário excluído');
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao excluir usuário');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      toast.success('Função atualizada');
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar função');
    }
  };

  // Stats management
  const handleSaveStats = async () => {
    try {
      await statsApi.update(statsForm);
      toast.success('Estatísticas salvas');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao salvar estatísticas');
    }
  };

  // Leaders management
  const handleSaveLeader = async () => {
    try {
      if (editingLeader) {
        await leadersApi.update(editingLeader.leader_id, leaderForm);
        toast.success('Líder atualizado');
      } else {
        await leadersApi.create(leaderForm);
        toast.success('Líder adicionado');
      }
      setShowLeaderModal(false);
      setEditingLeader(null);
      setLeaderForm({ name: '', role: '', instagram: '', photo_url: '', order: 0 });
      loadAllData();
    } catch (error) {
      toast.error('Erro ao salvar líder');
    }
  };

  const handleDeleteLeader = async (leaderId) => {
    if (!window.confirm('Excluir este líder?')) return;
    try {
      await leadersApi.delete(leaderId);
      toast.success('Líder excluído');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao excluir líder');
    }
  };

  // Settings
  const handleSaveSettings = async () => {
    try {
      await settingsApi.update(settingsForm);
      toast.success('Configurações salvas');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  // Pages
  const handleEditPage = async (slug) => {
    try {
      const res = await pagesApi.getPage(slug);
      setEditingPage(slug);
      setPageForm(res.data);
      setShowPageModal(true);
    } catch (error) {
      toast.error('Erro ao carregar página');
    }
  };

  const handleSavePage = async () => {
    try {
      await pagesApi.updatePage(editingPage, pageForm);
      toast.success('Página atualizada');
      setShowPageModal(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar página');
    }
  };

  // Photo management
  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Excluir esta foto?')) return;
    try {
      await galleryApi.delete(photoId);
      toast.success('Foto excluída');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao excluir foto');
    }
  };

  // Memories
  const handleSaveMemory = async () => {
    try {
      if (editingMemory) {
        await memoriesApi.update(editingMemory.memory_id, memoryForm);
        toast.success('Recordação atualizada');
      } else {
        await memoriesApi.create(memoryForm);
        toast.success('Recordação adicionada');
      }
      setShowMemoryModal(false);
      setEditingMemory(null);
      setMemoryForm({ title: '', content: '', image_url: '', layout: 'left', order: 0, highlight: false });
      loadAllData();
    } catch (error) {
      toast.error('Erro ao salvar recordação');
    }
  };

  const handleDeleteMemory = async (memoryId) => {
    if (!window.confirm('Excluir esta recordação?')) return;
    try {
      await memoriesApi.delete(memoryId);
      toast.success('Recordação excluída');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao excluir recordação');
    }
  };

  // Airport Timeline
  const handleSaveTimeline = async () => {
    try {
      if (editingTimeline) {
        await timelineApi.updateAirportItem(editingTimeline.item_id, timelineForm);
        toast.success('Item atualizado');
      } else {
        await timelineApi.createAirportItem(timelineForm);
        toast.success('Item adicionado');
      }
      setShowTimelineModal(false);
      setEditingTimeline(null);
      setTimelineForm({ year: '', description: '', order: 0 });
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar item');
    }
  };

  const handleDeleteTimeline = async (itemId) => {
    if (!window.confirm('Excluir este item?')) return;
    try {
      await timelineApi.deleteAirportItem(itemId);
      toast.success('Item excluído');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao excluir item');
    }
  };

  // Spotters Milestones
  const handleSaveMilestone = async () => {
    try {
      if (editingMilestone) {
        await timelineApi.updateSpottersItem(editingMilestone.item_id, milestoneForm);
        toast.success('Marco atualizado');
      } else {
        await timelineApi.createSpottersItem(milestoneForm);
        toast.success('Marco adicionado');
      }
      setShowMilestoneModal(false);
      setEditingMilestone(null);
      setMilestoneForm({ year: '', title: '', description: '', order: 0 });
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar marco');
    }
  };

  const handleDeleteMilestone = async (itemId) => {
    if (!window.confirm('Excluir este marco?')) return;
    try {
      await timelineApi.deleteSpottersItem(itemId);
      toast.success('Marco excluído');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao excluir marco');
    }
  };

  const pendingUsers = users.filter(u => !u.approved && u.role !== 'admin_principal');
  const approvedUsers = users.filter(u => u.approved);

  // Load filtered logs
  const loadFilteredLogs = async () => {
    try {
      const params = { limit: 100 };
      if (logFilters.action) params.action = logFilters.action;
      if (logFilters.entity_type) params.entity_type = logFilters.entity_type;
      if (logFilters.admin_id) params.admin_id = logFilters.admin_id;
      
      const res = await logsApi.list(params);
      setAuditLogs(res.data?.logs || []);
    } catch (error) {
      toast.error('Erro ao carregar logs');
    }
  };

  // Action type labels
  const actionLabels = {
    create: { label: 'Criação', color: 'bg-green-500/20 text-green-400' },
    update: { label: 'Atualização', color: 'bg-blue-500/20 text-blue-400' },
    delete: { label: 'Exclusão', color: 'bg-red-500/20 text-red-400' },
    approve: { label: 'Aprovação', color: 'bg-emerald-500/20 text-emerald-400' },
    reject: { label: 'Rejeição', color: 'bg-orange-500/20 text-orange-400' },
    tag_change: { label: 'Alteração Tag', color: 'bg-purple-500/20 text-purple-400' },
    settings_change: { label: 'Config.', color: 'bg-yellow-500/20 text-yellow-400' },
    login: { label: 'Login', color: 'bg-sky-500/20 text-sky-400' },
    logout: { label: 'Logout', color: 'bg-gray-500/20 text-gray-400' }
  };

  const entityLabels = {
    user: 'Usuário',
    photo: 'Foto',
    news: 'Notícia',
    leader: 'Líder',
    memory: 'Recordação',
    settings: 'Configurações',
    page: 'Página',
    evaluation: 'Avaliação'
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-[#0a1929] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-[#0a1929]">
      {/* Header */}
      <section className="py-12 border-b border-[#1a3a5c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-sky-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-sky-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
              <p className="text-gray-400">
                {isAdminPrincipal ? 'Admin Principal' : 'Admin Autorizado'} - Gerencie o site Spotters CXJ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="stats" className="space-y-8">
            <TabsList className="bg-[#102a43] border border-[#1a3a5c] flex-wrap h-auto p-1 gap-1">
              <TabsTrigger value="stats" className="data-[state=active]:bg-sky-600">
                <BarChart3 size={16} className="mr-2" />Estatísticas
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-sky-600">
                <Clock size={16} className="mr-2" />Linhas do Tempo
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-sky-600">
                <Users size={16} className="mr-2" />Usuários
              </TabsTrigger>
              <TabsTrigger value="leaders" className="data-[state=active]:bg-sky-600">
                <Crown size={16} className="mr-2" />Liderança
              </TabsTrigger>
              <TabsTrigger value="photos" className="data-[state=active]:bg-sky-600">
                <Camera size={16} className="mr-2" />Galeria
              </TabsTrigger>
              <TabsTrigger value="memories" className="data-[state=active]:bg-sky-600">
                <Image size={16} className="mr-2" />Recordações
              </TabsTrigger>
              <TabsTrigger value="pages" className="data-[state=active]:bg-sky-600">
                <FileText size={16} className="mr-2" />Páginas
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-sky-600">
                <Settings size={16} className="mr-2" />Configurações
              </TabsTrigger>
            </TabsList>

            {/* Stats Tab */}
            <TabsContent value="stats">
              <div className="card-navy p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <BarChart3 size={20} className="text-sky-400" />
                  Estatísticas do Site
                </h2>
                <p className="text-gray-400 mb-6">Edite os números exibidos na página inicial e na página de informações.</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Membros Ativos</label>
                    <Input
                      value={statsForm.members || ''}
                      onChange={(e) => setStatsForm({...statsForm, members: e.target.value})}
                      placeholder="ex: 50+"
                      className="bg-[#102a43] border-[#1a3a5c] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Fotos Registradas</label>
                    <Input
                      value={statsForm.photos || ''}
                      onChange={(e) => setStatsForm({...statsForm, photos: e.target.value})}
                      placeholder="ex: 5.000+"
                      className="bg-[#102a43] border-[#1a3a5c] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Eventos Realizados</label>
                    <Input
                      value={statsForm.events || ''}
                      onChange={(e) => setStatsForm({...statsForm, events: e.target.value})}
                      placeholder="ex: 30+"
                      className="bg-[#102a43] border-[#1a3a5c] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Anos de História</label>
                    <Input
                      value={statsForm.years || ''}
                      onChange={(e) => setStatsForm({...statsForm, years: e.target.value})}
                      placeholder="ex: 8+"
                      className="bg-[#102a43] border-[#1a3a5c] text-white"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveStats} className="mt-6 btn-accent">
                  <Save size={16} className="mr-2" />Salvar Estatísticas
                </Button>
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-8">
              {/* Airport Timeline - Admin Principal Only */}
              <div className="card-navy p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Calendar size={20} className="text-sky-400" />
                      Linha do Tempo do Aeroporto
                    </h2>
                    {!isAdminPrincipal && (
                      <p className="text-amber-400 text-sm mt-1">Somente Admin Principal pode editar</p>
                    )}
                  </div>
                  {isAdminPrincipal && (
                    <Button onClick={() => { setEditingTimeline(null); setTimelineForm({ year: '', description: '', order: 0 }); setShowTimelineModal(true); }} className="btn-accent">
                      <Plus size={16} className="mr-2" />Adicionar
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {airportTimeline.map((item, index) => (
                    <div key={item.item_id || index} className="flex items-center justify-between bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c]">
                      <div className="flex items-center gap-4">
                        <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full text-sm font-semibold">{item.year}</span>
                        <p className="text-gray-300">{item.description}</p>
                      </div>
                      {isAdminPrincipal && !item.item_id?.startsWith('default') && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingTimeline(item); setTimelineForm(item); setShowTimelineModal(true); }} className="text-gray-400 hover:text-white">
                            <Edit size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteTimeline(item.item_id)} className="text-red-400">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Spotters Milestones */}
              <div className="card-navy p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Clock size={20} className="text-amber-400" />
                    Marcos Importantes dos Spotters CXJ
                  </h2>
                  <Button onClick={() => { setEditingMilestone(null); setMilestoneForm({ year: '', title: '', description: '', order: 0 }); setShowMilestoneModal(true); }} className="btn-accent">
                    <Plus size={16} className="mr-2" />Adicionar
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {spottersMilestones.map((item, index) => (
                    <div key={item.item_id || index} className="bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c]">
                      <div className="flex items-start justify-between mb-2">
                        <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded text-sm font-bold">{item.year}</span>
                        {!item.item_id?.startsWith('default') && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => { setEditingMilestone(item); setMilestoneForm(item); setShowMilestoneModal(true); }} className="text-gray-400 hover:text-white h-7 w-7 p-0">
                              <Edit size={12} />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteMilestone(item.item_id)} className="text-red-400 h-7 w-7 p-0">
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        )}
                      </div>
                      <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-8">
              <div className="card-navy p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <RefreshCw size={20} className="text-amber-400" />
                  Aguardando Aprovação ({pendingUsers.length})
                </h2>
                {pendingUsers.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Nenhuma solicitação pendente</p>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((u) => (
                      <div key={u.user_id} className="flex items-center justify-between bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c]">
                        <div className="flex items-center gap-4">
                          <img src={u.picture || 'https://via.placeholder.com/40'} alt={u.name} className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="text-white font-medium">{u.name}</p>
                            <p className="text-gray-400 text-sm">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApproveUser(u.user_id)} className="bg-emerald-600 hover:bg-emerald-500">
                            <UserCheck size={16} className="mr-1" />Aprovar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRejectUser(u.user_id)}>
                            <UserX size={16} className="mr-1" />Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-navy p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Check size={20} className="text-emerald-400" />
                  Usuários Aprovados ({approvedUsers.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1a3a5c]">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Usuário</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Função</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedUsers.map((u) => (
                        <tr key={u.user_id} className="border-b border-[#1a3a5c]/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img src={u.picture || 'https://via.placeholder.com/32'} alt={u.name} className="w-8 h-8 rounded-full" />
                              <span className="text-white">{u.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-400">{u.email}</td>
                          <td className="py-3 px-4">
                            {u.role === 'admin_principal' ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">Admin Principal</span>
                            ) : isAdminPrincipal ? (
                              <select value={u.role} onChange={(e) => handleChangeRole(u.user_id, e.target.value)} className="bg-[#102a43] border border-[#1a3a5c] rounded px-2 py-1 text-white text-sm">
                                <option value="contributor">Contribuidor</option>
                                <option value="admin_authorized">Admin Autorizado</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin_authorized' ? 'bg-sky-500/20 text-sky-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                {u.role === 'admin_authorized' ? 'Admin Autorizado' : 'Contribuidor'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {u.role !== 'admin_principal' && (
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(u.user_id)} className="text-red-400 hover:text-red-300">
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Leaders Tab */}
            <TabsContent value="leaders">
              <div className="card-navy p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Crown size={20} className="text-sky-400" />Gerenciar Liderança
                  </h2>
                  <Button onClick={() => { setEditingLeader(null); setLeaderForm({ name: '', role: '', instagram: '', photo_url: '', order: 0 }); setShowLeaderModal(true); }} className="btn-accent">
                    <Plus size={16} className="mr-2" />Adicionar Líder
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leaders.map((leader) => (
                    <div key={leader.leader_id} className="bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-sky-500/20 rounded-full flex items-center justify-center overflow-hidden">
                          {leader.photo_url ? <img src={leader.photo_url} alt={leader.name} className="w-full h-full object-cover" /> : <Users className="text-sky-400" />}
                        </div>
                        <div>
                          <p className="text-white font-medium">{leader.name}</p>
                          <p className="text-sky-400 text-sm">{leader.role}</p>
                        </div>
                      </div>
                      {leader.instagram && <p className="text-pink-400 text-sm mb-3">{leader.instagram}</p>}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditingLeader(leader); setLeaderForm(leader); setShowLeaderModal(true); }} className="flex-1 border-[#1a3a5c] text-gray-300">
                          <Edit size={14} className="mr-1" />Editar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteLeader(leader.leader_id)} className="text-red-400">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos">
              <div className="card-navy p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Camera size={20} className="text-sky-400" />Gerenciar Galeria ({photos.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.photo_id} className="bg-[#0a1929] rounded-lg overflow-hidden border border-[#1a3a5c]">
                      <div className="aspect-square">
                        <img src={photo.url?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${photo.url}` : photo.url} alt={photo.description} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="text-white text-sm font-medium truncate">{photo.aircraft_model}</p>
                        <p className="text-gray-500 text-xs">Por {photo.author_name}</p>
                        <Button size="sm" variant="ghost" onClick={() => handleDeletePhoto(photo.photo_id)} className="w-full mt-2 text-red-400 hover:bg-red-500/10">
                          <Trash2 size={14} className="mr-1" />Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Memories Tab */}
            <TabsContent value="memories">
              <div className="card-navy p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Image size={20} className="text-sky-400" />Gerenciar Recordações
                  </h2>
                  <Button onClick={() => { setEditingMemory(null); setMemoryForm({ title: '', content: '', image_url: '', layout: 'left', order: 0, highlight: false }); setShowMemoryModal(true); }} className="btn-accent">
                    <Plus size={16} className="mr-2" />Adicionar
                  </Button>
                </div>
                <div className="space-y-4">
                  {memories.map((memory) => (
                    <div key={memory.memory_id} className="bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {memory.image_url && <img src={memory.image_url} alt={memory.title} className="w-16 h-16 rounded-lg object-cover" />}
                        <div>
                          <p className="text-white font-medium">{memory.title}</p>
                          <p className="text-gray-400 text-sm truncate max-w-md">{memory.content}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditingMemory(memory); setMemoryForm(memory); setShowMemoryModal(true); }} className="border-[#1a3a5c] text-gray-300">
                          <Edit size={14} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteMemory(memory.memory_id)} className="text-red-400">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Pages Tab */}
            <TabsContent value="pages">
              <div className="card-navy p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <FileText size={20} className="text-sky-400" />Editar Páginas
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { slug: 'home', name: 'Página Inicial', desc: 'Conteúdo da home' },
                    { slug: 'airport-history', name: 'História do Aeroporto', desc: isAdminPrincipal ? 'Somente Admin Principal' : 'Apenas Admin Principal pode editar', locked: !isAdminPrincipal },
                    { slug: 'spotters-history', name: 'História dos Spotters', desc: 'Sobre o grupo' }
                  ].map((page) => (
                    <div key={page.slug} className="bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c]">
                      <h3 className="text-white font-medium mb-1">{page.name}</h3>
                      <p className="text-gray-500 text-sm mb-3">{page.desc}</p>
                      <Button size="sm" onClick={() => handleEditPage(page.slug)} disabled={page.locked} className={page.locked ? 'opacity-50' : ''}>
                        <Edit size={14} className="mr-1" />Editar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="card-navy p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Settings size={20} className="text-sky-400" />Configurações do Site
                </h2>
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Link do Google Forms (Faça Parte)</label>
                    <Input value={settingsForm.google_form_link || ''} onChange={(e) => setSettingsForm({...settingsForm, google_form_link: e.target.value})} placeholder="https://forms.google.com/..." className="bg-[#102a43] border-[#1a3a5c] text-white" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Instagram Handle</label>
                      <Input value={settingsForm.instagram_handle || ''} onChange={(e) => setSettingsForm({...settingsForm, instagram_handle: e.target.value})} placeholder="@spotterscxj" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Instagram URL</label>
                      <Input value={settingsForm.instagram_url || ''} onChange={(e) => setSettingsForm({...settingsForm, instagram_url: e.target.value})} placeholder="https://instagram.com/spotterscxj" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">YouTube Nome</label>
                      <Input value={settingsForm.youtube_name || ''} onChange={(e) => setSettingsForm({...settingsForm, youtube_name: e.target.value})} placeholder="Spotters CXJ" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">YouTube URL</label>
                      <Input value={settingsForm.youtube_url || ''} onChange={(e) => setSettingsForm({...settingsForm, youtube_url: e.target.value})} placeholder="https://youtube.com/@spotterscxj" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Texto do Rodapé</label>
                    <Textarea value={settingsForm.footer?.about_text || ''} onChange={(e) => setSettingsForm({...settingsForm, footer: {...(settingsForm.footer || {}), about_text: e.target.value}})} className="bg-[#102a43] border-[#1a3a5c] text-white" rows={3} />
                  </div>
                  <Button onClick={handleSaveSettings} className="btn-accent">
                    <Save size={16} className="mr-2" />Salvar Configurações
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Leader Modal */}
      <Dialog open={showLeaderModal} onOpenChange={setShowLeaderModal}>
        <DialogContent className="bg-[#0a1929] border-[#1a3a5c] text-white">
          <DialogHeader>
            <DialogTitle>{editingLeader ? 'Editar Líder' : 'Adicionar Líder'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={leaderForm.name} onChange={(e) => setLeaderForm({...leaderForm, name: e.target.value})} placeholder="Nome *" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Input value={leaderForm.role} onChange={(e) => setLeaderForm({...leaderForm, role: e.target.value})} placeholder="Cargo *" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Input value={leaderForm.instagram || ''} onChange={(e) => setLeaderForm({...leaderForm, instagram: e.target.value})} placeholder="Instagram (@usuario)" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Input value={leaderForm.photo_url || ''} onChange={(e) => setLeaderForm({...leaderForm, photo_url: e.target.value})} placeholder="URL da Foto" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Input type="number" value={leaderForm.order} onChange={(e) => setLeaderForm({...leaderForm, order: parseInt(e.target.value) || 0})} placeholder="Ordem" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Button onClick={handleSaveLeader} className="w-full btn-accent">
              <Save size={16} className="mr-2" />Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Memory Modal */}
      <Dialog open={showMemoryModal} onOpenChange={setShowMemoryModal}>
        <DialogContent className="bg-[#0a1929] border-[#1a3a5c] text-white">
          <DialogHeader>
            <DialogTitle>{editingMemory ? 'Editar Recordação' : 'Adicionar Recordação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={memoryForm.title} onChange={(e) => setMemoryForm({...memoryForm, title: e.target.value})} placeholder="Título *" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Textarea value={memoryForm.content} onChange={(e) => setMemoryForm({...memoryForm, content: e.target.value})} placeholder="Conteúdo *" className="bg-[#102a43] border-[#1a3a5c] text-white" rows={4} />
            <Input value={memoryForm.image_url || ''} onChange={(e) => setMemoryForm({...memoryForm, image_url: e.target.value})} placeholder="URL da Imagem" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <div className="flex gap-4">
              <select value={memoryForm.layout} onChange={(e) => setMemoryForm({...memoryForm, layout: e.target.value})} className="flex-1 bg-[#102a43] border border-[#1a3a5c] rounded-lg px-3 py-2 text-white">
                <option value="left">Imagem à esquerda</option>
                <option value="right">Imagem à direita</option>
              </select>
              <label className="flex items-center gap-2 text-gray-300">
                <input type="checkbox" checked={memoryForm.highlight} onChange={(e) => setMemoryForm({...memoryForm, highlight: e.target.checked})} />
                Destaque
              </label>
            </div>
            <Button onClick={handleSaveMemory} className="w-full btn-accent">
              <Save size={16} className="mr-2" />Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Page Edit Modal */}
      <Dialog open={showPageModal} onOpenChange={setShowPageModal}>
        <DialogContent className="bg-[#0a1929] border-[#1a3a5c] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Página</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={pageForm.title || ''} onChange={(e) => setPageForm({...pageForm, title: e.target.value})} placeholder="Título" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Input value={pageForm.subtitle || ''} onChange={(e) => setPageForm({...pageForm, subtitle: e.target.value})} placeholder="Subtítulo" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Textarea value={pageForm.content || ''} onChange={(e) => setPageForm({...pageForm, content: e.target.value})} placeholder="Conteúdo" className="bg-[#102a43] border-[#1a3a5c] text-white" rows={10} />
            <Button onClick={handleSavePage} className="w-full btn-accent">
              <Save size={16} className="mr-2" />Salvar Página
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timeline Modal */}
      <Dialog open={showTimelineModal} onOpenChange={setShowTimelineModal}>
        <DialogContent className="bg-[#0a1929] border-[#1a3a5c] text-white">
          <DialogHeader>
            <DialogTitle>{editingTimeline ? 'Editar Item' : 'Adicionar Item'} - Linha do Tempo do Aeroporto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={timelineForm.year} onChange={(e) => setTimelineForm({...timelineForm, year: e.target.value})} placeholder="Ano/Década (ex: 1990s) *" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Textarea value={timelineForm.description} onChange={(e) => setTimelineForm({...timelineForm, description: e.target.value})} placeholder="Descrição do evento *" className="bg-[#102a43] border-[#1a3a5c] text-white" rows={3} />
            <Input type="number" value={timelineForm.order} onChange={(e) => setTimelineForm({...timelineForm, order: parseInt(e.target.value) || 0})} placeholder="Ordem" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Button onClick={handleSaveTimeline} className="w-full btn-accent">
              <Save size={16} className="mr-2" />Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Milestone Modal */}
      <Dialog open={showMilestoneModal} onOpenChange={setShowMilestoneModal}>
        <DialogContent className="bg-[#0a1929] border-[#1a3a5c] text-white">
          <DialogHeader>
            <DialogTitle>{editingMilestone ? 'Editar Marco' : 'Adicionar Marco'} - Spotters CXJ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={milestoneForm.year} onChange={(e) => setMilestoneForm({...milestoneForm, year: e.target.value})} placeholder="Ano (ex: 2020) *" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Input value={milestoneForm.title || ''} onChange={(e) => setMilestoneForm({...milestoneForm, title: e.target.value})} placeholder="Título *" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Textarea value={milestoneForm.description} onChange={(e) => setMilestoneForm({...milestoneForm, description: e.target.value})} placeholder="Descrição *" className="bg-[#102a43] border-[#1a3a5c] text-white" rows={3} />
            <Input type="number" value={milestoneForm.order} onChange={(e) => setMilestoneForm({...milestoneForm, order: parseInt(e.target.value) || 0})} placeholder="Ordem" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Button onClick={handleSaveMilestone} className="w-full btn-accent">
              <Save size={16} className="mr-2" />Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
