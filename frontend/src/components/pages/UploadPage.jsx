import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Upload, Camera, AlertTriangle, Check, CreditCard, X, Info, Search, Loader2, Star, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { photosApi } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import api from '../../services/api';

const AIRCRAFT_TYPES = ['Airbus', 'Boeing', 'Embraer', 'ATR', 'Aviação Geral'];

export const UploadPage = () => {
  const { user } = useAuth();
  const [queueStatus, setQueueStatus] = useState({ current: 0, max: 50, is_full: false });
  const [myPhotos, setMyPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [lookingUpAnac, setLookingUpAnac] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'my-photos'
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    aircraft_model: '',
    aircraft_type: 'Boeing',
    registration: '',
    airline: '',
    location: '',
    photo_date: new Date().toISOString().split('T')[0],
    file: null,
    credits: '',
    is_own_photo: true
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [queueRes, photosRes] = await Promise.all([
        photosApi.getQueue(),
        photosApi.getMy()
      ]);
      setQueueStatus(queueRes.data);
      setMyPhotos(photosRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB');
        return;
      }
      setFormData({ ...formData, file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const lookupAnac = async () => {
    if (!formData.registration || formData.registration.length < 5) {
      toast.error('Digite uma matrícula válida (ex: PR-GXJ)');
      return;
    }

    setLookingUpAnac(true);
    try {
      const response = await api.get(`/aircraft/anac_lookup?registration=${formData.registration}`);
      const result = response.data;
      
      if (result.found && result.data) {
        const data = result.data;
        setFormData(prev => ({
          ...prev,
          aircraft_model: data.model || prev.aircraft_model,
          airline: data.operator || data.owner || prev.airline,
          aircraft_type: detectAircraftType(data.manufacturer || data.model || '')
        }));
        toast.success('Dados da aeronave encontrados!');
      } else {
        toast.error(result.error || 'Aeronave não encontrada');
      }
    } catch (error) {
      toast.error('Erro ao consultar ANAC');
    } finally {
      setLookingUpAnac(false);
    }
  };

  const detectAircraftType = (model) => {
    const modelLower = model.toLowerCase();
    if (modelLower.includes('airbus') || modelLower.includes('a320') || modelLower.includes('a319') || modelLower.includes('a321') || modelLower.includes('a330') || modelLower.includes('a350')) return 'Airbus';
    if (modelLower.includes('boeing') || modelLower.includes('737') || modelLower.includes('767') || modelLower.includes('777') || modelLower.includes('787')) return 'Boeing';
    if (modelLower.includes('embraer') || modelLower.includes('erj') || modelLower.includes('e-jet') || modelLower.includes('e175') || modelLower.includes('e190') || modelLower.includes('e195')) return 'Embraer';
    if (modelLower.includes('atr')) return 'ATR';
    return 'Aviação Geral';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.file) {
      toast.error('Selecione uma foto');
      return;
    }

    if (queueStatus.is_full) {
      toast.error('Fila de aprovação cheia. Tente mais tarde.');
      return;
    }

    // Validate credits
    if (!formData.is_own_photo && !formData.credits.trim()) {
      toast.error('Informe os créditos da foto');
      return;
    }

    try {
      setUploading(true);
      
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'is_own_photo') {
            data.append(key, value ? 'true' : 'false');
          } else {
            data.append(key, value);
          }
        }
      });

      await photosApi.upload(data);
      toast.success('Foto enviada para avaliação!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        aircraft_model: '',
        aircraft_type: 'Boeing',
        registration: '',
        airline: '',
        location: '',
        photo_date: new Date().toISOString().split('T')[0],
        file: null,
        credits: '',
        is_own_photo: true
      });
      setPreview(null);
      loadData();
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error(error.response?.data?.detail || 'Erro ao enviar foto');
      if (error.response?.status === 403) {
        setShowPaymentInfo(true);
      }
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-2">Área do Spotter</h1>
        <p className="text-gray-400 mb-8">Envie suas fotos e acompanhe suas submissões</p>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'upload' 
                ? 'bg-sky-600 text-white' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Upload size={18} className="inline mr-2" />
            Enviar Foto
          </button>
          <button
            onClick={() => setActiveTab('my-photos')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'my-photos' 
                ? 'bg-sky-600 text-white' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Camera size={18} className="inline mr-2" />
            Minhas Fotos ({myPhotos.length})
          </button>
        </div>

        {activeTab === 'upload' && (
          <>
            {/* Queue Status */}
            <div className="glass-card p-4 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    queueStatus.current < 30 ? 'bg-green-500' :
                    queueStatus.current < 45 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-white">Fila de Aprovação</span>
                </div>
                <span className="text-gray-400">
                  {queueStatus.current}/{queueStatus.max} fotos
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    queueStatus.current < 30 ? 'bg-green-500' :
                    queueStatus.current < 45 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(queueStatus.current / queueStatus.max) * 100}%` }}
                />
              </div>
              {queueStatus.is_full && (
                <p className="text-yellow-400 text-sm mt-2 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Fila cheia. Aguarde a liberação para enviar novas fotos.
                </p>
              )}
            </div>

            {/* Upload Form */}
            <form onSubmit={handleSubmit} className="glass-card p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Photo Upload */}
                <div className="md:col-span-2">
                  <label className="block">
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      preview ? 'border-sky-500' : 'border-white/20 hover:border-white/40'
                    }`}>
                      {preview ? (
                        <div className="relative">
                          <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setPreview(null);
                              setFormData({ ...formData, file: null });
                            }}
                            className="absolute top-2 right-2 bg-red-500 p-1 rounded-full"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload size={48} className="mx-auto mb-4 text-gray-500" />
                          <p className="text-white font-medium">Clique para selecionar ou arraste a foto</p>
                          <p className="text-gray-500 text-sm mt-1">JPG, PNG, WEBP - Máximo 10MB</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Title */}
                <div>
                  <label className="text-white font-medium block mb-2">Título *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Boeing 737 pousando no CXJ"
                    required
                    className="bg-white/5 border-white/10"
                  />
                </div>

                {/* Registration with ANAC Lookup */}
                <div>
                  <label className="text-white font-medium block mb-2">Matrícula</label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.registration}
                      onChange={(e) => setFormData({ ...formData, registration: e.target.value.toUpperCase() })}
                      placeholder="Ex: PR-GXJ"
                      className="bg-white/5 border-white/10 flex-1"
                    />
                    <Button
                      type="button"
                      onClick={lookupAnac}
                      disabled={lookingUpAnac || !formData.registration}
                      variant="outline"
                      className="border-sky-500/50 text-sky-400 hover:bg-sky-500/10"
                    >
                      {lookingUpAnac ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Search size={18} />
                      )}
                    </Button>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">Clique na lupa para buscar dados da ANAC</p>
                </div>

                {/* Aircraft Model */}
                <div>
                  <label className="text-white font-medium block mb-2">Modelo da Aeronave *</label>
                  <Input
                    value={formData.aircraft_model}
                    onChange={(e) => setFormData({ ...formData, aircraft_model: e.target.value })}
                    placeholder="Ex: Boeing 737-800"
                    required
                    className="bg-white/5 border-white/10"
                  />
                </div>

                {/* Aircraft Type */}
                <div>
                  <label className="text-white font-medium block mb-2">Tipo *</label>
                  <select
                    value={formData.aircraft_type}
                    onChange={(e) => setFormData({ ...formData, aircraft_type: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                  >
                    {AIRCRAFT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Airline */}
                <div>
                  <label className="text-white font-medium block mb-2">Companhia</label>
                  <Input
                    value={formData.airline}
                    onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                    placeholder="Ex: GOL Linhas Aéreas"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="text-white font-medium block mb-2">Local</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Aeroporto CXJ"
                    className="bg-white/5 border-white/10"
                  />
                </div>

                {/* Photo Date */}
                <div>
                  <label className="text-white font-medium block mb-2">Data da Foto *</label>
                  <Input
                    type="date"
                    value={formData.photo_date}
                    onChange={(e) => setFormData({ ...formData, photo_date: e.target.value })}
                    required
                    className="bg-white/5 border-white/10"
                  />
                </div>

                {/* Credits Section */}
                <div className="md:col-span-2 p-4 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <CreditCard size={18} className="text-sky-400" />
                    Créditos da Foto
                  </h3>
                  
                  <label className="flex items-center gap-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.is_own_photo}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        is_own_photo: e.target.checked,
                        credits: e.target.checked ? '' : formData.credits
                      })}
                      className="w-5 h-5 rounded border-gray-600 bg-white/5 text-sky-500 focus:ring-sky-500"
                    />
                    <span className="text-white">Esta foto é de minha autoria</span>
                  </label>

                  {!formData.is_own_photo && (
                    <div>
                      <label className="text-gray-300 text-sm block mb-2">
                        Informe os créditos do autor *
                      </label>
                      <Input
                        value={formData.credits}
                        onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                        placeholder="Ex: Foto por João Silva / @joaosilva"
                        required={!formData.is_own_photo}
                        className="bg-white/5 border-white/10"
                      />
                      <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        O uso de fotos sem autorização pode resultar em suspensão
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="text-white font-medium block mb-2">Descrição</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Conte mais sobre esta foto..."
                    className="bg-white/5 border-white/10"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  type="submit"
                  disabled={uploading || queueStatus.is_full || !formData.file}
                  className="flex-1 bg-sky-600 hover:bg-sky-500"
                >
                  {uploading ? 'Enviando...' : 'Enviar Foto'}
                </Button>
              </div>
            </form>
          </>
        )}

        {activeTab === 'my-photos' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-bold text-white">{myPhotos.length}</div>
                <div className="text-gray-400 text-sm">Total de Fotos</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-bold text-green-400">
                  {myPhotos.filter(p => p.status === 'approved').length}
                </div>
                <div className="text-gray-400 text-sm">Aprovadas</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  {myPhotos.filter(p => p.status === 'pending').length}
                </div>
                <div className="text-gray-400 text-sm">Pendentes</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-bold text-red-400">
                  {myPhotos.filter(p => p.status === 'rejected').length}
                </div>
                <div className="text-gray-400 text-sm">Recusadas</div>
              </div>
            </div>

            {/* Photos Grid */}
            {myPhotos.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Camera size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">Você ainda não enviou nenhuma foto</p>
                <Button
                  onClick={() => setActiveTab('upload')}
                  className="mt-4 bg-sky-600 hover:bg-sky-500"
                >
                  Enviar Primeira Foto
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPhotos.map((photo) => (
                  <div key={photo.photo_id} className="glass-card overflow-hidden">
                    <div className="relative">
                      <img
                        src={photo.url?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${photo.url}` : photo.url}
                        alt={photo.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        photo.status === 'approved' ? 'bg-green-500/90 text-white' :
                        photo.status === 'rejected' ? 'bg-red-500/90 text-white' :
                        'bg-yellow-500/90 text-black'
                      }`}>
                        {photo.status === 'approved' && <CheckCircle size={12} />}
                        {photo.status === 'rejected' && <XCircle size={12} />}
                        {photo.status === 'pending' && <Clock size={12} />}
                        {photo.status === 'approved' ? 'Aprovada' :
                         photo.status === 'rejected' ? 'Recusada' : 'Pendente'}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold line-clamp-1">{photo.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{photo.aircraft_model}</p>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                        <div className="text-gray-500 text-xs">
                          {new Date(photo.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-3">
                          {photo.public_rating > 0 && (
                            <span className="text-yellow-400 text-sm flex items-center gap-1">
                              <Star size={14} fill="currentColor" />
                              {photo.public_rating.toFixed(1)}
                            </span>
                          )}
                          {photo.final_rating > 0 && (
                            <span className="text-sky-400 text-sm">
                              Nota: {photo.final_rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Evaluation Comments */}
                      {photo.evaluation_comment && (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg">
                          <p className="text-gray-400 text-xs font-medium mb-1">Comentário do Avaliador:</p>
                          <p className="text-gray-300 text-sm">{photo.evaluation_comment}</p>
                        </div>
                      )}

                      {/* Credits */}
                      {photo.credits && (
                        <div className="mt-2 text-gray-500 text-xs">
                          📷 {photo.credits}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Info Modal */}
        {showPaymentInfo && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Limite Semanal Atingido</h2>
                <button onClick={() => setShowPaymentInfo(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <p className="text-gray-400 mb-6">
                Você atingiu o limite de 5 fotos por semana. Para enviar mais fotos, escolha uma das opções:
              </p>

              <div className="space-y-4">
                <div className="glass-card p-4 border-pink-500/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-semibold">Foto Avulsa</h3>
                      <p className="text-gray-400 text-sm">+1 foto extra esta semana</p>
                    </div>
                    <span className="text-green-400 font-bold">R$ 3,50</span>
                  </div>
                </div>

                <div className="glass-card p-4 border-sky-500/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-sky-500 text-black text-xs font-bold px-2 py-1">
                    MELHOR OPÇÃO
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-semibold">Colaborador</h3>
                      <p className="text-gray-400 text-sm">Upload ilimitado + tag VIP</p>
                    </div>
                    <span className="text-green-400 font-bold">R$ 15/mês</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm flex items-start gap-2">
                  <Info size={16} className="flex-shrink-0 mt-0.5" />
                  Para realizar o pagamento, entre em contato com a administração via Instagram ou pelo painel de contato.
                </p>
              </div>

              <Button
                onClick={() => setShowPaymentInfo(false)}
                className="w-full mt-4"
                variant="outline"
              >
                Entendi
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
