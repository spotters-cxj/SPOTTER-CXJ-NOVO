import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Upload, Camera, AlertTriangle, Check, CreditCard, X, Info, Search, Loader2, Edit, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { photosApi, aircraftApi } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

const AIRCRAFT_TYPES = ['Airbus', 'Boeing', 'Embraer', 'ATR', 'Aviação Geral'];

export const UploadPage = () => {
  const { user } = useAuth();
  const [queueStatus, setQueueStatus] = useState({ current: 0, max: 50, is_full: false });
  const [myPhotos, setMyPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [registrationDisabled, setRegistrationDisabled] = useState(false);
  const [suggestedModels, setSuggestedModels] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    aircraft_model: '',
    aircraft_type: 'Boeing',
    registration: '',
    airline: '',
    location: '',
    photo_date: new Date().toISOString().split('T')[0],
    file: null
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
      // Validate size
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB');
        return;
      }
      
      // Validate dimensions using Image object
      const img = new Image();
      img.onload = () => {
        const minDimension = 1080;
        if (img.width < minDimension && img.height < minDimension) {
          toast.error(`Resolução muito baixa. Mínimo: ${minDimension}p (ex: 1920x1080)`);
          return;
        }
        setFormData({ ...formData, file });
        setPreview(URL.createObjectURL(file));
      };
      img.onerror = () => {
        toast.error('Erro ao carregar imagem');
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleLookupRegistration = async () => {
    if (!formData.registration || formData.registration.trim().length < 4) {
      toast.warning('Digite uma matrícula válida (ex: PR-GXJ)');
      return;
    }
    
    try {
      setLookingUp(true);
      const response = await aircraftApi.lookup(formData.registration);
      
      if (response.data.found) {
        const updates = {};
        if (response.data.operator) updates.airline = response.data.operator;
        if (response.data.aircraft_type && response.data.aircraft_type !== 'Mixed') {
          updates.aircraft_type = response.data.aircraft_type;
        }
        
        // Store suggested models
        if (response.data.suggested_models && response.data.suggested_models.length > 0) {
          setSuggestedModels(response.data.suggested_models);
          toast.success(`✈️ Encontrado: ${response.data.operator || 'Aeronave brasileira'}. Selecione o modelo abaixo.`);
        } else {
          toast.success(`✈️ Encontrado: ${response.data.operator || 'Aeronave brasileira'}`);
        }
        
        setFormData(prev => ({ ...prev, ...updates }));
      } else {
        setSuggestedModels([]);
        toast.info('Matrícula não encontrada no banco local. Preencha manualmente.');
      }
    } catch (error) {
      console.error('Error looking up registration:', error);
      toast.error('Erro ao buscar matrícula');
      setSuggestedModels([]);
    } finally {
      setLookingUp(false);
    }
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

    try {
      setUploading(true);
      
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          data.append(key, value);
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
        file: null
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
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-2">Enviar Foto</h1>
        <p className="text-gray-400 mb-8">Compartilhe suas melhores capturas com a comunidade</p>

        {/* Queue Status */}
        <div className="glass-card p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`queue-dot ${
                queueStatus.current < 30 ? 'green' :
                queueStatus.current < 45 ? 'yellow' : 'red'
              }`} />
              <span className="text-white">Fila de Aprovação</span>
            </div>
            <span className="text-gray-400">
              {queueStatus.current}/{queueStatus.max} fotos
            </span>
          </div>
          <div className="progress-bar mt-3">
            <div 
              className="progress-fill" 
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

            {/* Aircraft Model */}
            <div>
              <label className="text-white font-medium block mb-2">Modelo da Aeronave *</label>
              {suggestedModels.length > 0 ? (
                <select
                  value={formData.aircraft_model}
                  onChange={(e) => setFormData({ ...formData, aircraft_model: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Selecione o modelo</option>
                  {suggestedModels.map((model) => (
                    <option key={model.model} value={model.full_name}>
                      {model.full_name}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={formData.aircraft_model}
                  onChange={(e) => setFormData({ ...formData, aircraft_model: e.target.value })}
                  placeholder="Ex: Boeing 737-800"
                  required
                  className="bg-white/5 border-white/10"
                />
              )}
              {suggestedModels.length > 0 && (
                <p className="text-green-400 text-xs mt-1">
                  ✅ Modelos sugeridos baseados na matrícula
                </p>
              )}
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

            {/* Registration */}
            <div>
              <label className="text-white font-medium block mb-2">Matrícula</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={formData.registration}
                  onChange={(e) => setFormData({ ...formData, registration: e.target.value.toUpperCase() })}
                  placeholder="Ex: PR-GXJ"
                  disabled={registrationDisabled}
                  className="bg-white/5 border-white/10 flex-1"
                />
                <Button
                  type="button"
                  onClick={handleLookupRegistration}
                  disabled={lookingUp || registrationDisabled}
                  className="bg-sky-600 hover:bg-sky-500 text-white px-3"
                  title="Buscar informações da aeronave"
                >
                  {lookingUp ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Search size={16} />
                  )}
                </Button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={registrationDisabled}
                  onChange={(e) => {
                    setRegistrationDisabled(e.target.checked);
                    if (e.target.checked) {
                      setFormData({ ...formData, registration: '' });
                      setSuggestedModels([]);
                    }
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-sky-500 focus:ring-sky-500"
                />
                <span className="text-gray-400 text-sm">
                  Matrícula não visível / Múltiplas aeronaves
                </span>
              </label>
              {!registrationDisabled && (
                <p className="text-gray-500 text-xs mt-1">
                  Clique na lupa para preencher automaticamente
                </p>
              )}
            </div>

            {/* Airline */}
            <div>
              <label className="text-white font-medium block mb-2">Companhia *</label>
              <Input
                value={formData.airline}
                onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                placeholder="Ex: GOL Linhas Aéreas"
                required
                className="bg-white/5 border-white/10"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-white font-medium block mb-2">Local *</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Aeroporto CXJ"
                required
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

        {/* My Photos */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Minhas Fotos</h2>
          
          {myPhotos.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Camera size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">Você ainda não enviou nenhuma foto</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myPhotos.map((photo) => (
                <div key={photo.photo_id} className="glass-card overflow-hidden">
                  <img
                    src={photo.url?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL}${photo.url}` : photo.url}
                    alt={photo.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3">
                    <h3 className="text-white font-medium text-sm line-clamp-1">{photo.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        photo.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        photo.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {photo.status === 'approved' ? 'Aprovada' :
                         photo.status === 'rejected' ? 'Recusada' : 'Pendente'}
                      </span>
                      {photo.public_rating > 0 && (
                        <span className="text-yellow-400 text-sm">⭐ {photo.public_rating.toFixed(1)}</span>
                      )}
                    </div>
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

export default UploadPage;
