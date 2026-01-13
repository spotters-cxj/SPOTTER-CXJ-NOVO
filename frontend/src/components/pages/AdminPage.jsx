import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Users, Check, X, Trash2, Shield, Camera, Settings, RefreshCw, Plus, Edit, Save, 
  Image, FileText, UserCheck, UserX, Crown, Clock, BarChart3, Calendar, History, 
  Search, Filter, Tag, Newspaper, CreditCard, Instagram, Youtube, Eye, EyeOff,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle, Plane, MapPin,
  Download, Database, HardDrive, Award
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  adminApi, leadersApi, pagesApi, settingsApi, memoriesApi, galleryApi, 
  timelineApi, statsApi, logsApi, newsApi, membersApi, evaluationApi, photosApi,
  backupApi, aircraftApi, creditsApi
} from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';

// Available tags - Ordem hierárquica: Líder > Admin > Gestor > Colaborador > VIP > Produtor > Spotter CXJ > Visitante
// Nota: Avaliador, Jornalista e Diretor do Aeroporto são tags ESPECIAIS com permissões específicas
const AVAILABLE_TAGS = [
  { value: 'lider', label: 'Líder', color: 'bg-yellow-500', icon: '👑', level: 8 },
  { value: 'admin', label: 'Admin', color: 'bg-red-500', icon: '🛡️', level: 7 },
  { value: 'gestao', label: 'Gestão', color: 'bg-purple-500', icon: '📊', level: 6 },
  { value: 'colaborador', label: 'Colaborador', color: 'bg-pink-500', icon: '⭐', level: 5 },
  { value: 'vip', label: 'VIP', color: 'bg-amber-500', icon: '💎', level: 4 },
  { value: 'produtor', label: 'Produtor', color: 'bg-blue-500', icon: '🎬', level: 3 },
  { value: 'avaliador', label: 'Avaliador', color: 'bg-green-500', icon: '✅', level: 2, special: true },
  { value: 'jornalista', label: 'Jornalista', color: 'bg-indigo-500', icon: '📰', level: 2, special: true },
  { value: 'diretor_aeroporto', label: 'Diretor do Aeroporto', color: 'bg-sky-600', icon: '🏢', level: 2, special: true },
  { value: 'spotter_cxj', label: 'Spotter CXJ', color: 'bg-cyan-500', icon: '✈️', level: 1 },
  { value: 'visitante', label: 'Visitante', color: 'bg-gray-500', icon: '👤', level: 0 },
  { value: 'podio', label: 'Pódio', color: 'bg-orange-500', icon: '🏆', level: -1, special: true },
];

// Função para ordenar tags pela hierarquia
const sortTagsByHierarchy = (tags) => {
  if (!tags || !Array.isArray(tags)) return [];
  return [...tags].sort((a, b) => {
    const tagA = AVAILABLE_TAGS.find(t => t.value === a);
    const tagB = AVAILABLE_TAGS.find(t => t.value === b);
    return (tagB?.level || 0) - (tagA?.level || 0);
  });
};

export const AdminPage = () => {
  const { user, isAdmin, isAdminPrincipal, isGestao } = useAuth();
  
  // Data states
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
  const [news, setNews] = useState([]);
  const [evaluationQueue, setEvaluationQueue] = useState([]);
  const [evaluationLogs, setEvaluationLogs] = useState([]);
  const [evaluationStats, setEvaluationStats] = useState({});
  const [backups, setBackups] = useState([]);
  const [backupStatus, setBackupStatus] = useState({});
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [userSearch, setUserSearch] = useState('');
  const [userTagFilter, setUserTagFilter] = useState('');
  const [logFilters, setLogFilters] = useState({ action: '', entity_type: '', admin_id: '' });
  const [evalFilters, setEvalFilters] = useState({ evaluator_id: '', date_from: '', date_to: '' });

  // Modal states
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showPageModal, setShowPageModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showPhotoEditModal, setShowPhotoEditModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null);
  const [editingMemory, setEditingMemory] = useState(null);
  const [editingPage, setEditingPage] = useState(null);
  const [editingTimeline, setEditingTimeline] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingNews, setEditingNews] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [editingCredit, setEditingCredit] = useState(null);

  // Form states
  const [leaderForm, setLeaderForm] = useState({ name: '', role: '', instagram: '', photo_url: '', order: 0 });
  const [memoryForm, setMemoryForm] = useState({ title: '', content: '', image_url: '', layout: 'left', order: 0, highlight: false });
  const [pageForm, setPageForm] = useState({ title: '', subtitle: '', content: '' });
  const [settingsForm, setSettingsForm] = useState({});
  const [statsForm, setStatsForm] = useState({ members: '', photos: '', events: '', years: '' });
  const [timelineForm, setTimelineForm] = useState({ year: '', description: '', order: 0 });
  const [milestoneForm, setMilestoneForm] = useState({ year: '', title: '', description: '', order: 0 });
  const [userForm, setUserForm] = useState({ tags: [], is_vip: false, approved: false, instagram: '', jetphotos: '' });
  const [newsForm, setNewsForm] = useState({ title: '', content: '', location: '', image: '', references: '', published: true });
  const [photoEditForm, setPhotoEditForm] = useState({ 
    airline: '', title: '', aircraft_model: '', aircraft_type: '', 
    registration: '', location: '', photo_date: '', description: '' 
  });
  const [creditForm, setCreditForm] = useState({ name: '', role: '', description: '', instagram: '', order: 0 });

  // Data states
  const [credits, setCredits] = useState([]);

  useEffect(() => {
    if (isGestao) {
      loadAllData();
    }
  }, [isGestao]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        adminApi.getUsers(),
        leadersApi.list(),
        galleryApi.list({}),
        memoriesApi.list(),
        settingsApi.get(),
        statsApi.get(),
        timelineApi.getAirport(),
        timelineApi.getSpotters(),
        logsApi.list({ limit: 50 }),
        logsApi.getStats(),
        newsApi.list(50),
        evaluationApi.getQueue(),
        logsApi.getEvaluations({ limit: 100 }),
        logsApi.getEvaluationStats(),
        backupApi.list(),
        backupApi.status(),
        creditsApi.list()
      ]);

      if (results[0].status === 'fulfilled') setUsers(results[0].value.data || []);
      if (results[1].status === 'fulfilled') setLeaders(results[1].value.data || []);
      if (results[2].status === 'fulfilled') setPhotos(results[2].value.data || []);
      if (results[3].status === 'fulfilled') setMemories(results[3].value.data || []);
      if (results[4].status === 'fulfilled') {
        setSettings(results[4].value.data || {});
        setSettingsForm(results[4].value.data || {});
      }
      if (results[5].status === 'fulfilled') {
        setStats(results[5].value.data || {});
        setStatsForm(results[5].value.data || {});
      }
      if (results[6].status === 'fulfilled') setAirportTimeline(results[6].value.data || []);
      if (results[7].status === 'fulfilled') setSpottersMilestones(results[7].value.data || []);
      if (results[8].status === 'fulfilled') setAuditLogs(results[8].value.data?.logs || []);
      if (results[9].status === 'fulfilled') setLogStats(results[9].value.data || {});
      if (results[10].status === 'fulfilled') setNews(results[10].value.data || []);
      if (results[11].status === 'fulfilled') setEvaluationQueue(results[11].value.data || []);
      if (results[12].status === 'fulfilled') setEvaluationLogs(results[12].value.data?.evaluations || []);
      if (results[13].status === 'fulfilled') setEvaluationStats(results[13].value.data || {});
      if (results[14].status === 'fulfilled') setBackups(results[14].value.data?.backups || []);
      if (results[15].status === 'fulfilled') setBackupStatus(results[15].value.data || {});
      if (results[16].status === 'fulfilled') setCredits(results[16].value.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // ========== CREDITS FUNCTIONS ==========
  const handleCreateCredit = () => {
    setCreditForm({ name: '', role: '', description: '', instagram: '', order: 0 });
    setEditingCredit(null);
    setShowCreditModal(true);
  };

  const handleEditCredit = (credit) => {
    setCreditForm({
      name: credit.name || '',
      role: credit.role || '',
      description: credit.description || '',
      instagram: credit.instagram || '',
      order: credit.order || 0
    });
    setEditingCredit(credit.member_id);
    setShowCreditModal(true);
  };

  const handleSaveCredit = async () => {
    try {
      if (editingCredit) {
        await creditsApi.update(editingCredit, creditForm);
        toast.success('Crédito atualizado');
      } else {
        await creditsApi.create(creditForm);
        toast.success('Crédito adicionado');
      }
      setShowCreditModal(false);
      loadAllData();
    } catch (error) {
      console.error('Error saving credit:', error);
      toast.error(error.response?.data?.detail || 'Erro ao salvar crédito');
    }
  };

  const handleDeleteCredit = async (memberId) => {
    if (!confirm('Remover este membro dos créditos?')) return;
    try {
      await creditsApi.delete(memberId);
      toast.success('Crédito removido');
      loadAllData();
    } catch (error) {
      console.error('Error deleting credit:', error);
      toast.error('Erro ao remover crédito');
    }
  };

  // ========== BACKUP FUNCTIONS ==========
  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      const response = await backupApi.create();
      toast.success(`Backup criado: ${response.data.filename}`);
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = (filename) => {
    window.open(backupApi.download(filename), '_blank');
  };

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`Excluir backup ${filename}?`)) return;
    try {
      await backupApi.delete(filename);
      toast.success('Backup excluído');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao excluir backup');
    }
  };

  // ========== PHOTO EDIT FUNCTIONS ==========
  const handleEditPhoto = (photo) => {
    setEditingPhoto(photo);
    setPhotoEditForm({
      airline: photo.airline || '',
      title: photo.title || '',
      aircraft_model: photo.aircraft_model || '',
      aircraft_type: photo.aircraft_type || '',
      registration: photo.registration || '',
      location: photo.location || '',
      photo_date: photo.photo_date || photo.date || '',
      description: photo.description || ''
    });
    setShowPhotoEditModal(true);
  };

  const handleSavePhotoEdit = async () => {
    // Validar campos obrigatórios
    const required = ['airline', 'title', 'aircraft_model', 'aircraft_type', 'registration', 'location', 'photo_date'];
    for (const field of required) {
      if (!photoEditForm[field] || photoEditForm[field].trim() === '') {
        toast.error(`Campo obrigatório: ${field}`);
        return;
      }
    }

    try {
      await photosApi.edit(editingPhoto.photo_id, photoEditForm);
      toast.success('Foto atualizada com sucesso');
      setShowPhotoEditModal(false);
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar foto');
    }
  };

  const handleLookupRegistration = async () => {
    if (!photoEditForm.registration) return;
    try {
      const response = await aircraftApi.lookup(photoEditForm.registration);
      if (response.data.found) {
        setPhotoEditForm(prev => ({
          ...prev,
          airline: response.data.operator || prev.airline,
          aircraft_type: response.data.aircraft_type || prev.aircraft_type
        }));
        toast.success(`Encontrado: ${response.data.operator}`);
      } else {
        toast.info('Matrícula não encontrada no banco. Preencha manualmente.');
      }
    } catch (error) {
      toast.error('Erro ao buscar matrícula');
    }
  };

  if (!user || !isGestao) {
    return <Navigate to="/" replace />;
  }

  // ========== USER MANAGEMENT ==========
  const handleEditUser = (userItem) => {
    setEditingUser(userItem);
    setUserForm({
      tags: userItem.tags || ['visitante'],
      is_vip: userItem.is_vip || false,
      approved: userItem.approved || false,
      instagram: userItem.instagram || '',
      jetphotos: userItem.jetphotos || ''
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      await membersApi.updateTags(editingUser.user_id, userForm.tags);
      
      // Update other fields if admin
      if (isAdmin) {
        await adminApi.approveUser(editingUser.user_id, userForm.approved);
      }
      
      toast.success('Usuário atualizado');
      setShowUserModal(false);
      loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar usuário');
    }
  };

  const toggleUserTag = (tag) => {
    const currentTags = userForm.tags || [];
    if (currentTags.includes(tag)) {
      setUserForm({ ...userForm, tags: currentTags.filter(t => t !== tag) });
    } else {
      setUserForm({ ...userForm, tags: [...currentTags, tag] });
    }
  };

  const handleApproveUser = async (userId, approve) => {
    try {
      await adminApi.approveUser(userId, approve);
      toast.success(approve ? 'Usuário aprovado' : 'Usuário rejeitado');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
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

  // ========== NEWS MANAGEMENT ==========
  const handleEditNews = (newsItem) => {
    setEditingNews(newsItem);
    setNewsForm({
      title: newsItem?.title || '',
      content: newsItem?.content || '',
      location: newsItem?.location || '',
      image: newsItem?.image || '',
      references: newsItem?.references || '',
      published: newsItem?.published ?? true
    });
    setShowNewsModal(true);
  };

  const handleSaveNews = async () => {
    try {
      if (editingNews?.news_id) {
        await newsApi.update(editingNews.news_id, newsForm);
        toast.success('Notícia atualizada');
      } else {
        await newsApi.create(newsForm);
        toast.success('Notícia criada');
      }
      setShowNewsModal(false);
      setEditingNews(null);
      loadAllData();
    } catch (error) {
      toast.error('Erro ao salvar notícia');
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (!window.confirm('Excluir esta notícia?')) return;
    try {
      await newsApi.delete(newsId);
      toast.success('Notícia excluída');
      loadAllData();
    } catch (error) {
      toast.error('Erro ao excluir notícia');
    }
  };

  // ========== STATS ==========
  const handleSaveStats = async () => {
    try {
      console.log('Saving stats:', statsForm);
      const response = await statsApi.update(statsForm);
      console.log('Stats saved successfully:', response);
      toast.success('Estatísticas salvas');
      loadAllData();
    } catch (error) {
      console.error('Error saving stats:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Erro ao salvar estatísticas');
    }
  };

  // ========== LEADERS ==========
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

  // ========== SETTINGS ==========
  const handleSaveSettings = async () => {
    try {
      console.log('Saving settings:', settingsForm);
      const response = await settingsApi.update(settingsForm);
      console.log('Settings saved successfully:', response);
      toast.success('Configurações salvas');
      loadAllData();
    } catch (error) {
      console.error('Error saving settings:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Erro ao salvar configurações');
    }
  };

  // ========== PAGES ==========
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
      console.log('Saving page:', editingPage, pageForm);
      const response = await pagesApi.updatePage(editingPage, pageForm);
      console.log('Page saved:', response);
      toast.success('Página atualizada');
      setShowPageModal(false);
      loadAllData();
    } catch (error) {
      console.error('Error saving page:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Erro ao salvar página');
    }
  };

  // ========== PHOTOS ==========
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

  // ========== MEMORIES ==========
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

  // ========== TIMELINE ==========
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
      toast.error('Erro ao salvar item');
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

  // ========== MILESTONES ==========
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
      toast.error('Erro ao salvar marco');
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

  // ========== LOGS ==========
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

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = !userSearch || 
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesTag = !userTagFilter || u.tags?.includes(userTagFilter);
    return matchesSearch && matchesTag;
  });

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

  // Action labels for logs
  const actionLabels = {
    create: { label: 'Criação', color: 'bg-green-500/20 text-green-400' },
    update: { label: 'Atualização', color: 'bg-blue-500/20 text-blue-400' },
    delete: { label: 'Exclusão', color: 'bg-red-500/20 text-red-400' },
    approve: { label: 'Aprovação', color: 'bg-emerald-500/20 text-emerald-400' },
    reject: { label: 'Rejeição', color: 'bg-orange-500/20 text-orange-400' },
    tag_change: { label: 'Alteração Tag', color: 'bg-purple-500/20 text-purple-400' },
    settings_change: { label: 'Config.', color: 'bg-yellow-500/20 text-yellow-400' },
  };

  const entityLabels = {
    user: 'Usuário', photo: 'Foto', news: 'Notícia', leader: 'Líder',
    memory: 'Recordação', settings: 'Configurações', page: 'Página', evaluation: 'Avaliação'
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-[#0a1929] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-[#0a1929]">
      {/* Header */}
      <section className="py-8 border-b border-[#1a3a5c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-sky-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-sky-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
                <p className="text-gray-400">
                  {isAdminPrincipal ? '👑 Líder' : isAdmin ? '🛡️ Admin' : '📊 Gestão'} - Gerencie o Spotters CXJ
                </p>
              </div>
            </div>
            <Button onClick={loadAllData} variant="outline" className="border-gray-600">
              <RefreshCw size={16} className="mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="members" className="space-y-6">
            <TabsList className="bg-[#102a43] border border-[#1a3a5c] flex-wrap h-auto p-1 gap-1">
              <TabsTrigger value="members" className="data-[state=active]:bg-sky-600">
                <Users size={16} className="mr-2" />Membros
              </TabsTrigger>
              <TabsTrigger value="news" className="data-[state=active]:bg-sky-600">
                <Newspaper size={16} className="mr-2" />Notícias
              </TabsTrigger>
              <TabsTrigger value="evaluation" className="data-[state=active]:bg-sky-600">
                <CheckCircle size={16} className="mr-2" />Fila
              </TabsTrigger>
              <TabsTrigger value="eval-logs" className="data-[state=active]:bg-sky-600">
                <History size={16} className="mr-2" />Avaliações
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-sky-600">
                <BarChart3 size={16} className="mr-2" />Estatísticas
              </TabsTrigger>
              <TabsTrigger value="airport" className="data-[state=active]:bg-sky-600">
                <Plane size={16} className="mr-2" />Aeroporto
              </TabsTrigger>
              <TabsTrigger value="pages" className="data-[state=active]:bg-sky-600">
                <FileText size={16} className="mr-2" />Textos
              </TabsTrigger>
              <TabsTrigger value="credits" className="data-[state=active]:bg-sky-600">
                <Award size={16} className="mr-2" />Créditos
              </TabsTrigger>
              <TabsTrigger value="photos" className="data-[state=active]:bg-sky-600">
                <Camera size={16} className="mr-2" />Galeria
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-sky-600">
                <Settings size={16} className="mr-2" />Links
              </TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-sky-600">
                <History size={16} className="mr-2" />Logs
              </TabsTrigger>
              <TabsTrigger value="backup" className="data-[state=active]:bg-sky-600">
                <Database size={16} className="mr-2" />Backup
              </TabsTrigger>
            </TabsList>

            {/* ==================== MEMBERS TAB ==================== */}
            <TabsContent value="members" className="space-y-6">
              {/* Pending Users */}
              {pendingUsers.length > 0 && (
                <div className="card-navy p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="text-amber-400" size={20} />
                    Aguardando Aprovação ({pendingUsers.length})
                  </h2>
                  <div className="space-y-3">
                    {pendingUsers.map((u) => (
                      <div key={u.user_id} className="flex items-center justify-between bg-[#0a1929] rounded-lg p-4 border border-amber-500/20">
                        <div className="flex items-center gap-3">
                          <img src={u.picture || '/logo-spotters-round.png'} alt={u.name} className="w-10 h-10 rounded-full" />
                          <div>
                            <div className="text-white font-medium">{u.name}</div>
                            <div className="text-gray-500 text-sm">{u.email}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApproveUser(u.user_id, true)} className="bg-green-600 hover:bg-green-500">
                            <Check size={14} className="mr-1" />Aprovar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleApproveUser(u.user_id, false)}>
                            <X size={14} className="mr-1" />Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Members */}
              <div className="card-navy p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Users className="text-sky-400" size={20} />
                    Todos os Membros ({users.length})
                  </h2>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10 bg-[#102a43] border-[#1a3a5c] text-white"
                    />
                  </div>
                  <select
                    value={userTagFilter}
                    onChange={(e) => setUserTagFilter(e.target.value)}
                    className="px-4 py-2 bg-[#102a43] border border-[#1a3a5c] rounded-lg text-white"
                  >
                    <option value="">Todas as tags</option>
                    {AVAILABLE_TAGS.map(tag => (
                      <option key={tag.value} value={tag.value}>{tag.icon} {tag.label}</option>
                    ))}
                  </select>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#102a43]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Usuário</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tags</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">VIP</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a3a5c]">
                      {filteredUsers.map((u) => (
                        <tr key={u.user_id} className="hover:bg-[#102a43]/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={u.picture || '/logo-spotters-round.png'} alt={u.name} className="w-10 h-10 rounded-full" />
                              <div>
                                <div className="text-white font-medium">{u.name}</div>
                                <div className="text-gray-500 text-xs">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {sortTagsByHierarchy(u.tags || []).map(tag => {
                                const tagConfig = AVAILABLE_TAGS.find(t => t.value === tag);
                                return (
                                  <span key={tag} className={`px-2 py-0.5 rounded text-xs ${tagConfig?.color || 'bg-gray-500'} text-white`}>
                                    {tagConfig?.icon} {tagConfig?.label || tag}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.approved ? (
                              <span className="text-green-400 text-xs">✓ Aprovado</span>
                            ) : (
                              <span className="text-amber-400 text-xs">⏳ Pendente</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.is_vip ? <span className="text-amber-400">💎</span> : <span className="text-gray-600">-</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEditUser(u)} className="text-sky-400 hover:text-sky-300">
                                <Edit size={14} />
                              </Button>
                              {!u.tags?.includes('lider') && (
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(u.user_id)} className="text-red-400 hover:text-red-300">
                                  <Trash2 size={14} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* ==================== NEWS TAB ==================== */}
            <TabsContent value="news" className="space-y-6">
              <div className="card-navy p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Newspaper className="text-sky-400" size={20} />
                    Notícias ({news.length})
                  </h2>
                  <Button onClick={() => handleEditNews(null)} className="btn-accent">
                    <Plus size={16} className="mr-2" />Nova Notícia
                  </Button>
                </div>

                <div className="space-y-4">
                  {news.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Nenhuma notícia publicada</p>
                    </div>
                  ) : (
                    news.map((item) => (
                      <div key={item.news_id} className="bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c] flex gap-4">
                        {item.image && (
                          <img 
                            src={item.image.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${item.image}` : item.image} 
                            alt={item.title} 
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-white font-semibold">{item.title}</h3>
                              <p className="text-gray-400 text-sm mt-1 line-clamp-2">{item.content}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                                {item.location && <span className="flex items-center gap-1"><MapPin size={12} />{item.location}</span>}
                                <span className={item.published ? 'text-green-400' : 'text-amber-400'}>
                                  {item.published ? '✓ Publicada' : '⏳ Rascunho'}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button size="sm" variant="ghost" onClick={() => handleEditNews(item)} className="text-sky-400">
                                <Edit size={14} />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteNews(item.news_id)} className="text-red-400">
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ==================== EVALUATION TAB ==================== */}
            <TabsContent value="evaluation" className="space-y-6">
              <div className="card-navy p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <CheckCircle className="text-green-400" size={20} />
                  Fila de Avaliação ({evaluationQueue.length}/50)
                </h2>

                <div className="mb-6">
                  <div className="h-3 bg-[#102a43] rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        evaluationQueue.length < 30 ? 'bg-green-500' :
                        evaluationQueue.length < 45 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(evaluationQueue.length / 50) * 100}%` }}
                    />
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    {evaluationQueue.length >= 50 ? '⚠️ Fila cheia - uploads bloqueados' : 
                     evaluationQueue.length >= 45 ? '⚠️ Fila quase cheia' : 
                     '✓ Fila com espaço disponível'}
                  </p>
                </div>

                {evaluationQueue.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Nenhuma foto aguardando avaliação</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {evaluationQueue.map((photo) => (
                      <div key={photo.photo_id} className="bg-[#0a1929] rounded-lg overflow-hidden border border-[#1a3a5c]">
                        <img 
                          src={photo.url?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${photo.url}` : photo.url} 
                          alt={photo.title}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-3">
                          <h4 className="text-white font-medium text-sm line-clamp-1">{photo.title}</h4>
                          <p className="text-gray-500 text-xs">{photo.author_name}</p>
                          <p className="text-gray-500 text-xs mt-1">{photo.aircraft_model}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ==================== EVALUATION LOGS TAB ==================== */}
            <TabsContent value="eval-logs" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="card-navy p-4">
                  <div className="text-gray-400 text-sm">Total de Avaliações</div>
                  <div className="text-2xl font-bold text-white">{evaluationStats.total || 0}</div>
                </div>
                <div className="card-navy p-4">
                  <div className="text-gray-400 text-sm">Últimas 24h</div>
                  <div className="text-2xl font-bold text-sky-400">{evaluationStats.recent_24h || 0}</div>
                </div>
                <div className="card-navy p-4">
                  <div className="text-gray-400 text-sm">Últimos 7 dias</div>
                  <div className="text-2xl font-bold text-green-400">{evaluationStats.recent_7d || 0}</div>
                </div>
                <div className="card-navy p-4">
                  <div className="text-gray-400 text-sm">Média Geral</div>
                  <div className="text-2xl font-bold text-amber-400">⭐ {evaluationStats.average_score || 0}</div>
                </div>
              </div>

              {/* Top Evaluators */}
              {evaluationStats.by_evaluator?.length > 0 && (
                <div className="card-navy p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Crown className="text-yellow-400" size={20} />
                    Top Avaliadores
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {evaluationStats.by_evaluator.slice(0, 8).map((ev, idx) => (
                      <div key={ev.evaluator_id} className="bg-[#0a1929] rounded-lg p-3 border border-[#1a3a5c]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-gray-600'
                          } text-white`}>
                            {idx + 1}
                          </span>
                          <span className="text-white font-medium text-sm truncate">{ev.evaluator_name}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">{ev.count} avaliações</span>
                          <span className="text-amber-400">⭐ {ev.avg_score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluation Logs Table */}
              <div className="card-navy overflow-hidden">
                <div className="p-4 border-b border-[#1a3a5c]">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <History size={20} className="text-green-400" />
                    Registro de Avaliações de Fotos
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Histórico completo de todas as avaliações realizadas</p>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-[#1a3a5c] bg-[#0a1929]">
                  <div className="grid md:grid-cols-4 gap-4">
                    <select 
                      value={evalFilters.evaluator_id} 
                      onChange={(e) => setEvalFilters({...evalFilters, evaluator_id: e.target.value})}
                      className="bg-[#102a43] border border-[#1a3a5c] rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="">Todos os Avaliadores</option>
                      {evaluationStats.by_evaluator?.map(ev => (
                        <option key={ev.evaluator_id} value={ev.evaluator_id}>{ev.evaluator_name}</option>
                      ))}
                    </select>
                    <Input 
                      type="date" 
                      value={evalFilters.date_from}
                      onChange={(e) => setEvalFilters({...evalFilters, date_from: e.target.value})}
                      className="bg-[#102a43] border-[#1a3a5c] text-white"
                      placeholder="Data inicial"
                    />
                    <Input 
                      type="date" 
                      value={evalFilters.date_to}
                      onChange={(e) => setEvalFilters({...evalFilters, date_to: e.target.value})}
                      className="bg-[#102a43] border-[#1a3a5c] text-white"
                      placeholder="Data final"
                    />
                    <Button 
                      onClick={async () => {
                        try {
                          const res = await logsApi.getEvaluations({
                            limit: 100,
                            ...evalFilters
                          });
                          setEvaluationLogs(res.data?.evaluations || []);
                        } catch (e) {
                          toast.error('Erro ao filtrar');
                        }
                      }} 
                      className="btn-accent"
                    >
                      <Search size={16} className="mr-2" />Filtrar
                    </Button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#102a43]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Foto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Data/Hora</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Avaliador</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Técnica</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Composição</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Momento</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Edição</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Spotter</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a3a5c]">
                      {evaluationLogs.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="px-4 py-12 text-center text-gray-400">
                            <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Nenhuma avaliação registrada ainda</p>
                          </td>
                        </tr>
                      ) : (
                        evaluationLogs.map((ev) => (
                          <tr key={ev.evaluation_id} className="hover:bg-[#102a43]/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {ev.photo_url && (
                                  <img 
                                    src={ev.photo_url.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${ev.photo_url}` : ev.photo_url}
                                    alt={ev.photo_title}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <div className="text-white text-sm font-medium truncate max-w-[150px]">{ev.photo_title}</div>
                                  <div className="text-gray-500 text-xs">{ev.photo_author}</div>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    ev.photo_status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                    ev.photo_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                    'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {ev.photo_status === 'approved' ? '✓ Aprovada' : ev.photo_status === 'rejected' ? '✗ Rejeitada' : '⏳ Pendente'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="text-white">{new Date(ev.created_at).toLocaleDateString('pt-BR')}</div>
                              <div className="text-gray-500 text-xs">{new Date(ev.created_at).toLocaleTimeString('pt-BR')}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-white text-sm">{ev.evaluator_name}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-medium ${ev.criteria?.technical_quality >= 4 ? 'text-green-400' : ev.criteria?.technical_quality >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {ev.criteria?.technical_quality || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-medium ${ev.criteria?.composition >= 4 ? 'text-green-400' : ev.criteria?.composition >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {ev.criteria?.composition || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-medium ${ev.criteria?.moment_angle >= 4 ? 'text-green-400' : ev.criteria?.moment_angle >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {ev.criteria?.moment_angle || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-medium ${ev.criteria?.editing >= 4 ? 'text-green-400' : ev.criteria?.editing >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {ev.criteria?.editing || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-medium ${ev.criteria?.spotter_criteria >= 4 ? 'text-green-400' : ev.criteria?.spotter_criteria >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {ev.criteria?.spotter_criteria || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-lg font-bold ${ev.final_score >= 4 ? 'text-green-400' : ev.final_score >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                                ⭐ {ev.final_score}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* ==================== STATS TAB ==================== */}
            <TabsContent value="stats">
              <div className="card-navy p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <BarChart3 size={20} className="text-sky-400" />
                  Estatísticas do Site
                </h2>
                <p className="text-gray-400 mb-6">Edite os números exibidos na página inicial.</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Membros Ativos</label>
                    <Input value={statsForm.members || ''} onChange={(e) => setStatsForm({...statsForm, members: e.target.value})} placeholder="ex: 50+" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Fotos Registradas</label>
                    <Input value={statsForm.photos || ''} onChange={(e) => setStatsForm({...statsForm, photos: e.target.value})} placeholder="ex: 5.000+" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Eventos Realizados</label>
                    <Input value={statsForm.events || ''} onChange={(e) => setStatsForm({...statsForm, events: e.target.value})} placeholder="ex: 30+" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Anos de História</label>
                    <Input value={statsForm.years || ''} onChange={(e) => setStatsForm({...statsForm, years: e.target.value})} placeholder="ex: 8+" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                  </div>
                </div>
                <Button onClick={handleSaveStats} className="mt-6 btn-accent">
                  <Save size={16} className="mr-2" />Salvar Estatísticas
                </Button>
              </div>
            </TabsContent>

            {/* ==================== AIRPORT TAB ==================== */}
            <TabsContent value="airport" className="space-y-6">
              {/* Airport Timeline */}
              <div className="card-navy p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Plane size={20} className="text-sky-400" />
                    Linha do Tempo do Aeroporto
                  </h2>
                  <Button onClick={() => { setEditingTimeline(null); setTimelineForm({ year: '', description: '', order: 0 }); setShowTimelineModal(true); }} className="btn-accent">
                    <Plus size={16} className="mr-2" />Adicionar
                  </Button>
                </div>
                <div className="space-y-3">
                  {airportTimeline.map((item, index) => (
                    <div key={item.item_id || index} className="flex items-center justify-between bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c]">
                      <div className="flex items-center gap-4">
                        <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full text-sm font-semibold">{item.year}</span>
                        <p className="text-gray-300">{item.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingTimeline(item); setTimelineForm(item); setShowTimelineModal(true); }} className="text-gray-400 hover:text-white">
                          <Edit size={14} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteTimeline(item.item_id)} className="text-red-400">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spotters Milestones */}
              <div className="card-navy p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Clock size={20} className="text-amber-400" />
                    Marcos dos Spotters CXJ
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
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingMilestone(item); setMilestoneForm(item); setShowMilestoneModal(true); }} className="text-gray-400 hover:text-white h-7 w-7 p-0">
                            <Edit size={12} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteMilestone(item.item_id)} className="text-red-400 h-7 w-7 p-0">
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                      <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ==================== PAGES TAB ==================== */}
            <TabsContent value="pages">
              <div className="card-navy p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <FileText size={20} className="text-sky-400" />
                  Textos e Informações
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { slug: 'home', label: 'Página Inicial' },
                    { slug: 'group-info', label: 'Sobre o Grupo' },
                    { slug: 'airport-history', label: 'Aeroporto e História' },
                    { slug: 'spotters-history', label: 'História dos Spotters' }
                  ].map((page) => (
                    <div key={page.slug} className="bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c]">
                      <h3 className="text-white font-semibold mb-2">
                        {page.label}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">Edite os textos desta página</p>
                      <Button onClick={() => handleEditPage(page.slug)} className="w-full" variant="outline">
                        <Edit size={14} className="mr-2" />Editar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Memories */}
              <div className="card-navy p-6 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Image size={20} className="text-purple-400" />
                    Recordações
                  </h2>
                  <Button onClick={() => { setEditingMemory(null); setMemoryForm({ title: '', content: '', image_url: '', layout: 'left', order: 0, highlight: false }); setShowMemoryModal(true); }} className="btn-accent">
                    <Plus size={16} className="mr-2" />Adicionar
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {memories.map((memory) => (
                    <div key={memory.memory_id} className="bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c] flex gap-4">
                      {memory.image_url && (
                        <img src={memory.image_url} alt={memory.title} className="w-20 h-20 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold">{memory.title}</h4>
                        <p className="text-gray-400 text-sm line-clamp-2">{memory.content}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingMemory(memory); setMemoryForm(memory); setShowMemoryModal(true); }} className="text-sky-400">
                            <Edit size={12} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteMemory(memory.memory_id)} className="text-red-400">
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaders */}
              <div className="card-navy p-6 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Crown size={20} className="text-yellow-400" />
                    Liderança
                  </h2>
                  <Button onClick={() => { setEditingLeader(null); setLeaderForm({ name: '', role: '', instagram: '', photo_url: '', order: 0 }); setShowLeaderModal(true); }} className="btn-accent">
                    <Plus size={16} className="mr-2" />Adicionar
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leaders.map((leader) => (
                    <div key={leader.leader_id} className="bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c] text-center">
                      <img src={leader.photo_url || '/logo-spotters-round.png'} alt={leader.name} className="w-16 h-16 rounded-full mx-auto mb-3 object-cover" />
                      <h4 className="text-white font-semibold">{leader.name}</h4>
                      <p className="text-sky-400 text-sm">{leader.role}</p>
                      {leader.instagram && <p className="text-gray-500 text-xs mt-1">{leader.instagram}</p>}
                      <div className="flex justify-center gap-2 mt-3">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingLeader(leader); setLeaderForm(leader); setShowLeaderModal(true); }} className="text-sky-400">
                          <Edit size={12} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteLeader(leader.leader_id)} className="text-red-400">
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ==================== CREDITS TAB ==================== */}
            <TabsContent value="credits">
              <div className="card-navy p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Award size={20} className="text-sky-400" />
                    Créditos da Equipe ({credits.length})
                  </h2>
                  <Button onClick={handleCreateCredit} className="bg-sky-600 hover:bg-sky-500">
                    <Plus size={16} className="mr-2" />
                    Adicionar Membro
                  </Button>
                </div>

                <div className="grid gap-4">
                  {credits.sort((a, b) => a.order - b.order).map((credit) => (
                    <div key={credit.member_id} className="bg-[#0a1929] border border-[#1a3a5c] rounded-lg p-4 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{credit.order}</span>
                          <div>
                            <h3 className="text-white font-semibold">{credit.name}</h3>
                            <p className="text-sky-400 text-sm">{credit.role}</p>
                          </div>
                        </div>
                        {credit.description && (
                          <p className="text-gray-400 text-sm mb-2">{credit.description}</p>
                        )}
                        {credit.instagram && (
                          <a
                            href={`https://instagram.com/${credit.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-400 text-sm flex items-center gap-1 hover:text-pink-300"
                          >
                            <Instagram size={14} />
                            {credit.instagram}
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCredit(credit)}
                          className="text-sky-400 hover:text-sky-300"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCredit(credit.member_id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {credits.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Award size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Nenhum crédito adicionado ainda</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ==================== PHOTOS TAB ==================== */}
            <TabsContent value="photos">
              <div className="card-navy p-4 md:p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Camera size={20} className="text-sky-400" />
                  Galeria de Fotos ({photos.length})
                </h2>
                {/* Responsive grid - 1 col mobile, 2 tablet, 3-4 desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {photos.slice(0, 20).map((photo) => (
                    <div key={photo.photo_id} className="relative group bg-[#0a1929] rounded-lg overflow-hidden border border-[#1a3a5c] flex flex-col">
                      {/* Image Container - Fixed aspect ratio */}
                      <div className="relative w-full pt-[75%] overflow-hidden">
                        <img 
                          src={photo.url?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${photo.url}` : photo.url} 
                          alt={photo.title || photo.description} 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Edit/Delete buttons - Always visible on mobile, hover on desktop */}
                        <div className="absolute top-2 right-2 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEditPhoto(photo)} 
                            className="bg-sky-600/90 hover:bg-sky-500 text-white h-8 w-8 p-0"
                            title="Editar foto"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeletePhoto(photo.photo_id)} 
                            className="bg-red-600/90 hover:bg-red-500 text-white h-8 w-8 p-0"
                            title="Deletar foto"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                      {/* Info Container - Flexible height, no truncate on mobile */}
                      <div className="p-3 flex-1 flex flex-col gap-1">
                        <h4 className="text-white text-sm font-medium line-clamp-2">{photo.title || 'Sem título'}</h4>
                        <p className="text-gray-400 text-xs line-clamp-1">
                          {photo.registration || 'Sem matrícula'} • {photo.airline || photo.aircraft_type || 'N/A'}
                        </p>
                        <p className="text-gray-500 text-xs mt-auto">Por: {photo.author_name || 'Desconhecido'}</p>
                        {/* Status badge */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            photo.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            photo.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {photo.status === 'approved' ? '✓ Aprovada' : 
                             photo.status === 'rejected' ? '✗ Rejeitada' : 
                             '⏳ Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {photos.length > 20 && (
                  <p className="text-gray-400 text-sm mt-4 text-center">Mostrando 20 de {photos.length} fotos</p>
                )}
              </div>
            </TabsContent>

            {/* ==================== SETTINGS TAB ==================== */}
            <TabsContent value="settings">
              <div className="space-y-6">
                {/* Social Links */}
                <div className="card-navy p-6">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Settings size={20} className="text-sky-400" />
                    Links e Redes Sociais
                  </h2>
                  <div className="space-y-4 max-w-2xl">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">Link do Google Forms (Faça Parte)</label>
                      <Input value={settingsForm.google_form_link || ''} onChange={(e) => setSettingsForm({...settingsForm, google_form_link: e.target.value})} placeholder="https://forms.google.com/..." className="bg-[#102a43] border-[#1a3a5c] text-white" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm mb-2 flex items-center gap-2">
                          <Instagram size={16} className="text-pink-400" />Instagram Handle
                        </label>
                        <Input value={settingsForm.instagram_handle || ''} onChange={(e) => setSettingsForm({...settingsForm, instagram_handle: e.target.value})} placeholder="@spotterscxj" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">Instagram URL</label>
                        <Input value={settingsForm.instagram_url || ''} onChange={(e) => setSettingsForm({...settingsForm, instagram_url: e.target.value})} placeholder="https://instagram.com/spotterscxj" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm mb-2 flex items-center gap-2">
                          <Youtube size={16} className="text-red-500" />YouTube Nome
                        </label>
                        <Input value={settingsForm.youtube_name || ''} onChange={(e) => setSettingsForm({...settingsForm, youtube_name: e.target.value})} placeholder="Spotters CXJ" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">YouTube URL (completa)</label>
                        <Input value={settingsForm.youtube_url || ''} onChange={(e) => setSettingsForm({...settingsForm, youtube_url: e.target.value})} placeholder="https://youtube.com/@spotterscxj" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Settings */}
                <div className="card-navy p-6">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <CreditCard size={20} className="text-green-400" />
                    Configurações de Pagamento
                  </h2>
                  <div className="space-y-4 max-w-2xl">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">Chave Pix</label>
                        <Input value={settingsForm.pix_key || ''} onChange={(e) => setSettingsForm({...settingsForm, pix_key: e.target.value})} placeholder="email@exemplo.com ou CPF" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">Nome do Titular</label>
                        <Input value={settingsForm.pix_name || ''} onChange={(e) => setSettingsForm({...settingsForm, pix_name: e.target.value})} placeholder="Nome completo" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">Preço VIP Mensal</label>
                        <Input value={settingsForm.vip_monthly_price || ''} onChange={(e) => setSettingsForm({...settingsForm, vip_monthly_price: e.target.value})} placeholder="R$ 15,00" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">Preço VIP Permanente</label>
                        <Input value={settingsForm.vip_permanent_price || ''} onChange={(e) => setSettingsForm({...settingsForm, vip_permanent_price: e.target.value})} placeholder="R$ 100,00" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">Preço Foto Extra</label>
                        <Input value={settingsForm.extra_photo_price || ''} onChange={(e) => setSettingsForm({...settingsForm, extra_photo_price: e.target.value})} placeholder="R$ 3,50" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSettings} className="btn-accent">
                  <Save size={16} className="mr-2" />Salvar Todas as Configurações
                </Button>
              </div>
            </TabsContent>

            {/* ==================== LOGS TAB ==================== */}
            <TabsContent value="logs" className="space-y-6">
              {/* Log Stats */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="card-navy p-4">
                  <div className="text-gray-400 text-sm">Total de Ações</div>
                  <div className="text-2xl font-bold text-white">{logStats.total || 0}</div>
                </div>
                <div className="card-navy p-4">
                  <div className="text-gray-400 text-sm">Últimas 24h</div>
                  <div className="text-2xl font-bold text-sky-400">{logStats.recent_24h || 0}</div>
                </div>
                <div className="card-navy p-4">
                  <div className="text-gray-400 text-sm">Admins Ativos</div>
                  <div className="text-2xl font-bold text-purple-400">{logStats.by_admin?.length || 0}</div>
                </div>
                <div className="card-navy p-4">
                  <div className="text-gray-400 text-sm">Ação Mais Comum</div>
                  <div className="text-lg font-bold text-amber-400">
                    {logStats.by_action?.[0] ? actionLabels[logStats.by_action[0].action]?.label || logStats.by_action[0].action : '-'}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="card-navy p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Filter size={18} />Filtros
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <select value={logFilters.action} onChange={(e) => setLogFilters({...logFilters, action: e.target.value})} className="bg-[#102a43] border border-[#1a3a5c] rounded-lg px-3 py-2 text-white">
                    <option value="">Todas as Ações</option>
                    <option value="create">Criação</option>
                    <option value="update">Atualização</option>
                    <option value="delete">Exclusão</option>
                    <option value="approve">Aprovação</option>
                    <option value="reject">Rejeição</option>
                    <option value="tag_change">Alteração de Tag</option>
                  </select>
                  <select value={logFilters.entity_type} onChange={(e) => setLogFilters({...logFilters, entity_type: e.target.value})} className="bg-[#102a43] border border-[#1a3a5c] rounded-lg px-3 py-2 text-white">
                    <option value="">Todas as Entidades</option>
                    <option value="user">Usuário</option>
                    <option value="photo">Foto</option>
                    <option value="news">Notícia</option>
                    <option value="settings">Configurações</option>
                  </select>
                  <Input value={logFilters.admin_id} onChange={(e) => setLogFilters({...logFilters, admin_id: e.target.value})} placeholder="ID do Admin" className="bg-[#102a43] border-[#1a3a5c] text-white" />
                  <Button onClick={loadFilteredLogs} className="btn-accent">
                    <Search size={16} className="mr-2" />Filtrar
                  </Button>
                </div>
              </div>

              {/* Logs Table */}
              <div className="card-navy overflow-hidden">
                <div className="p-4 border-b border-[#1a3a5c] flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <History size={20} className="text-sky-400" />Histórico de Ações
                  </h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#102a43]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Data/Hora</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Admin</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ação</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Entidade</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a3a5c]">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-12 text-center text-gray-400">
                            <History size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Nenhum log registrado ainda</p>
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.log_id} className="hover:bg-[#102a43]/50">
                            <td className="px-4 py-3 text-sm">
                              <div className="text-white">{new Date(log.created_at).toLocaleDateString('pt-BR')}</div>
                              <div className="text-gray-500 text-xs">{new Date(log.created_at).toLocaleTimeString('pt-BR')}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-white text-sm font-medium">{log.admin_name}</div>
                              <div className="text-gray-500 text-xs">{log.admin_email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${actionLabels[log.action]?.color || 'bg-gray-500/20 text-gray-400'}`}>
                                {actionLabels[log.action]?.label || log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-300 text-sm">{entityLabels[log.entity_type] || log.entity_type}</div>
                              <div className="text-gray-500 text-xs">{log.entity_name}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-400 text-sm max-w-xs truncate" title={log.details}>{log.details || '-'}</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* ==================== BACKUP TAB ==================== */}
            <TabsContent value="backup" className="space-y-6">
              {/* Backup Status */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="card-navy p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Database size={16} />
                    Status
                  </div>
                  <div className="text-xl font-bold text-green-400">✓ Ativo</div>
                </div>
                <div className="card-navy p-4">
                  <div className="text-gray-400 text-sm">Total de Backups</div>
                  <div className="text-2xl font-bold text-white">{backupStatus.total_backups || 0}</div>
                </div>
                <div className="card-navy p-4">
                  <div className="text-gray-400 text-sm">Espaço Usado</div>
                  <div className="text-2xl font-bold text-sky-400">{backupStatus.total_size_mb || 0} MB</div>
                </div>
                <div className="card-navy p-4">
                  <div className="text-gray-400 text-sm">Último Backup</div>
                  <div className="text-lg font-bold text-amber-400">
                    {backupStatus.last_backup ? new Date(backupStatus.last_backup.created_at).toLocaleString('pt-BR') : 'Nenhum'}
                  </div>
                </div>
              </div>

              {/* Create Backup */}
              <div className="card-navy p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <HardDrive size={20} className="text-green-400" />
                      Sistema de Backup
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                      ✅ Backup automático a cada 1 hora para Google Drive. Todos os dados e fotos são salvos.
                    </p>
                  </div>
                  <Button 
                    onClick={handleCreateBackup} 
                    disabled={creatingBackup}
                    className="btn-accent"
                  >
                    {creatingBackup ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus size={16} className="mr-2" />
                        Criar Backup Manual
                      </>
                    )}
                  </Button>
                </div>

                {/* Backup List */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#102a43]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Arquivo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Data</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tamanho</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a3a5c]">
                      {backups.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-12 text-center text-gray-400">
                            <Database size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Nenhum backup encontrado</p>
                            <p className="text-sm mt-2">Crie seu primeiro backup clicando no botão acima</p>
                          </td>
                        </tr>
                      ) : (
                        backups.map((backup) => (
                          <tr key={backup.filename} className="hover:bg-[#102a43]/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Database size={16} className={backup.filename.includes('automatic') ? 'text-sky-400' : 'text-green-400'} />
                                <span className="text-white text-sm font-mono">{backup.filename}</span>
                                {backup.filename.includes('automatic') && (
                                  <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 text-xs rounded">Auto</span>
                                )}
                                {backup.filename.includes('manual') && (
                                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Manual</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-300 text-sm">
                              {new Date(backup.created_at).toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-gray-300 text-sm">
                              {backup.size_mb} MB
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleDownloadBackup(backup.filename)}
                                  className="text-sky-400 hover:text-sky-300"
                                >
                                  <Download size={14} className="mr-1" />
                                  Baixar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleDeleteBackup(backup.filename)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Backup Info */}
              <div className="card-navy p-6 bg-amber-500/5 border-amber-500/20">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="text-amber-400" size={18} />
                  Informações Importantes
                </h3>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• O backup inclui: usuários, fotos, avaliações, notícias, configurações e todos os dados do site</li>
                  <li>• Backups automáticos são criados a cada 6 horas</li>
                  <li>• São mantidos os últimos 10 backups automáticos (os mais antigos são excluídos)</li>
                  <li>• Backups manuais não são excluídos automaticamente</li>
                  <li>• Faça download dos backups periodicamente para maior segurança</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* ==================== MODALS ==================== */}
      
      {/* User Edit Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="bg-[#0a1929] border-[#1a3a5c] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#102a43] rounded-lg">
                <img src={editingUser.picture || '/logo-spotters-round.png'} alt={editingUser.name} className="w-12 h-12 rounded-full" />
                <div>
                  <div className="text-white font-medium">{editingUser.name}</div>
                  <div className="text-gray-500 text-sm">{editingUser.email}</div>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-3">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <button
                      key={tag.value}
                      onClick={() => toggleUserTag(tag.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        userForm.tags?.includes(tag.value) 
                          ? `${tag.color} text-white` 
                          : 'bg-[#102a43] text-gray-400 hover:bg-[#1a3a5c]'
                      }`}
                    >
                      {tag.icon} {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Instagram</label>
                  <Input 
                    value={userForm.instagram || ''} 
                    onChange={(e) => setUserForm({...userForm, instagram: e.target.value})} 
                    placeholder="@usuario" 
                    className="bg-[#102a43] border-[#1a3a5c] text-white" 
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2">JetPhotos</label>
                  <Input 
                    value={userForm.jetphotos || ''} 
                    onChange={(e) => setUserForm({...userForm, jetphotos: e.target.value})} 
                    placeholder="URL" 
                    className="bg-[#102a43] border-[#1a3a5c] text-white" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={userForm.approved} 
                    onChange={(e) => setUserForm({...userForm, approved: e.target.checked})}
                    className="w-4 h-4"
                  />
                  Aprovado
                </label>
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={userForm.is_vip} 
                    onChange={(e) => setUserForm({...userForm, is_vip: e.target.checked})}
                    className="w-4 h-4"
                  />
                  VIP
                </label>
              </div>

              <Button onClick={handleSaveUser} className="w-full btn-accent">
                <Save size={16} className="mr-2" />Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* News Modal */}
      <Dialog open={showNewsModal} onOpenChange={setShowNewsModal}>
        <DialogContent className="bg-[#0a1929] border-[#1a3a5c] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingNews ? 'Editar Notícia' : 'Nova Notícia'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={newsForm.title} onChange={(e) => setNewsForm({...newsForm, title: e.target.value})} placeholder="Título *" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Textarea value={newsForm.content} onChange={(e) => setNewsForm({...newsForm, content: e.target.value})} placeholder="Conteúdo *" className="bg-[#102a43] border-[#1a3a5c] text-white" rows={6} />
            <div className="grid grid-cols-2 gap-4">
              <Input value={newsForm.location || ''} onChange={(e) => setNewsForm({...newsForm, location: e.target.value})} placeholder="Local" className="bg-[#102a43] border-[#1a3a5c] text-white" />
              <Input value={newsForm.image || ''} onChange={(e) => setNewsForm({...newsForm, image: e.target.value})} placeholder="URL da Imagem" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            </div>
            <Input value={newsForm.references || ''} onChange={(e) => setNewsForm({...newsForm, references: e.target.value})} placeholder="Referências" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <label className="flex items-center gap-2 text-gray-300">
              <input type="checkbox" checked={newsForm.published} onChange={(e) => setNewsForm({...newsForm, published: e.target.checked})} />
              Publicar imediatamente
            </label>
            <Button onClick={handleSaveNews} className="w-full btn-accent">
              <Save size={16} className="mr-2" />Salvar Notícia
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Credit Modal */}
      <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
        <DialogContent className="bg-[#0a1929] border-[#1a3a5c] text-white">
          <DialogHeader>
            <DialogTitle>{editingCredit ? 'Editar' : 'Adicionar'} Crédito</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Nome *</label>
              <Input 
                value={creditForm.name} 
                onChange={(e) => setCreditForm({...creditForm, name: e.target.value})} 
                placeholder="Nome completo" 
                className="bg-[#102a43] border-[#1a3a5c] text-white" 
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Cargo *</label>
              <Input 
                value={creditForm.role} 
                onChange={(e) => setCreditForm({...creditForm, role: e.target.value})} 
                placeholder="Ex: Fundador, Desenvolvedor, Designer" 
                className="bg-[#102a43] border-[#1a3a5c] text-white" 
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Descrição</label>
              <Textarea 
                value={creditForm.description} 
                onChange={(e) => setCreditForm({...creditForm, description: e.target.value})} 
                placeholder="Breve descrição do que fez" 
                className="bg-[#102a43] border-[#1a3a5c] text-white" 
                rows={3} 
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Instagram</label>
              <Input 
                value={creditForm.instagram} 
                onChange={(e) => setCreditForm({...creditForm, instagram: e.target.value})} 
                placeholder="@usuario" 
                className="bg-[#102a43] border-[#1a3a5c] text-white" 
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Ordem (0 = primeiro)</label>
              <Input 
                type="number" 
                value={creditForm.order} 
                onChange={(e) => setCreditForm({...creditForm, order: parseInt(e.target.value) || 0})} 
                className="bg-[#102a43] border-[#1a3a5c] text-white" 
              />
            </div>
            <Button onClick={handleSaveCredit} className="w-full btn-accent">
              <Save size={16} className="mr-2" />
              {editingCredit ? 'Atualizar' : 'Adicionar'} Crédito
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timeline Modal */}
      <Dialog open={showTimelineModal} onOpenChange={setShowTimelineModal}>
        <DialogContent className="bg-[#0a1929] border-[#1a3a5c] text-white">
          <DialogHeader>
            <DialogTitle>{editingTimeline ? 'Editar' : 'Adicionar'} - Linha do Tempo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={timelineForm.year} onChange={(e) => setTimelineForm({...timelineForm, year: e.target.value})} placeholder="Ano/Década (ex: 1990s) *" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Textarea value={timelineForm.description} onChange={(e) => setTimelineForm({...timelineForm, description: e.target.value})} placeholder="Descrição *" className="bg-[#102a43] border-[#1a3a5c] text-white" rows={3} />
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
            <DialogTitle>{editingMilestone ? 'Editar' : 'Adicionar'} Marco</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={milestoneForm.year} onChange={(e) => setMilestoneForm({...milestoneForm, year: e.target.value})} placeholder="Ano (ex: 2020) *" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Input value={milestoneForm.title || ''} onChange={(e) => setMilestoneForm({...milestoneForm, title: e.target.value})} placeholder="Título *" className="bg-[#102a43] border-[#1a3a5c] text-white" />
            <Textarea value={milestoneForm.description} onChange={(e) => setMilestoneForm({...milestoneForm, description: e.target.value})} placeholder="Descrição *" className="bg-[#102a43] border-[#1a3a5c] text-white" rows={3} />
            <Button onClick={handleSaveMilestone} className="w-full btn-accent">
              <Save size={16} className="mr-2" />Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Edit Modal */}
      <Dialog open={showPhotoEditModal} onOpenChange={setShowPhotoEditModal}>
        <DialogContent className="bg-[#0a1929] border-[#1a3a5c] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit size={20} className="text-sky-400" />
              Editar Foto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview da foto */}
            {editingPhoto && (
              <div className="mb-4">
                <img 
                  src={editingPhoto.url?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${editingPhoto.url}` : editingPhoto.url} 
                  alt={editingPhoto.title || 'Foto'} 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            
            {/* Matrícula com busca automática */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Matrícula *</label>
              <div className="flex gap-2">
                <Input 
                  value={photoEditForm.registration || ''} 
                  onChange={(e) => setPhotoEditForm({...photoEditForm, registration: e.target.value.toUpperCase()})} 
                  placeholder="Ex: PR-GXJ" 
                  className="bg-[#102a43] border-[#1a3a5c] text-white flex-1" 
                />
                <Button 
                  type="button" 
                  onClick={handleLookupRegistration}
                  className="bg-sky-600 hover:bg-sky-500 text-white"
                  title="Buscar informações da aeronave"
                >
                  <Search size={16} className="mr-1" />
                  Buscar
                </Button>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Clique em "Buscar" para preencher automaticamente a companhia e tipo
              </p>
            </div>

            {/* Título e Companhia */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Título *</label>
                <Input 
                  value={photoEditForm.title || ''} 
                  onChange={(e) => setPhotoEditForm({...photoEditForm, title: e.target.value})} 
                  placeholder="Título da foto" 
                  className="bg-[#102a43] border-[#1a3a5c] text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Companhia *</label>
                <Input 
                  value={photoEditForm.airline || ''} 
                  onChange={(e) => setPhotoEditForm({...photoEditForm, airline: e.target.value})} 
                  placeholder="Ex: GOL Linhas Aéreas" 
                  className="bg-[#102a43] border-[#1a3a5c] text-white" 
                />
              </div>
            </div>

            {/* Modelo e Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Modelo *</label>
                <Input 
                  value={photoEditForm.aircraft_model || ''} 
                  onChange={(e) => setPhotoEditForm({...photoEditForm, aircraft_model: e.target.value})} 
                  placeholder="Ex: Boeing 737-800" 
                  className="bg-[#102a43] border-[#1a3a5c] text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Tipo *</label>
                <select
                  value={photoEditForm.aircraft_type || ''}
                  onChange={(e) => setPhotoEditForm({...photoEditForm, aircraft_type: e.target.value})}
                  className="w-full px-4 py-2 bg-[#102a43] border border-[#1a3a5c] rounded-md text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Selecione</option>
                  <option value="Airbus">Airbus</option>
                  <option value="Boeing">Boeing</option>
                  <option value="Embraer">Embraer</option>
                  <option value="ATR">ATR</option>
                  <option value="Aviação Geral">Aviação Geral</option>
                </select>
              </div>
            </div>

            {/* Local e Data */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Local *</label>
                <Input 
                  value={photoEditForm.location || ''} 
                  onChange={(e) => setPhotoEditForm({...photoEditForm, location: e.target.value})} 
                  placeholder="Ex: Aeroporto CXJ" 
                  className="bg-[#102a43] border-[#1a3a5c] text-white" 
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Data da Foto *</label>
                <Input 
                  type="date"
                  value={photoEditForm.photo_date || ''} 
                  onChange={(e) => setPhotoEditForm({...photoEditForm, photo_date: e.target.value})} 
                  className="bg-[#102a43] border-[#1a3a5c] text-white" 
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Descrição</label>
              <Textarea 
                value={photoEditForm.description || ''} 
                onChange={(e) => setPhotoEditForm({...photoEditForm, description: e.target.value})} 
                placeholder="Descrição opcional..." 
                className="bg-[#102a43] border-[#1a3a5c] text-white" 
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                onClick={() => setShowPhotoEditModal(false)} 
                variant="outline" 
                className="flex-1 border-[#1a3a5c] text-gray-300 hover:bg-[#1a3a5c]"
              >
                Cancelar
              </Button>
              <Button onClick={handleSavePhotoEdit} className="flex-1 btn-accent">
                <Save size={16} className="mr-2" />Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
