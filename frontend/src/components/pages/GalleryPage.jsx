import React, { useState, useEffect } from 'react';
import { Camera, Calendar, User, Plane, Search, Filter, X, Upload } from 'lucide-react';
import { galleryApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner';

export const GalleryPage = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAircraft, setFilterAircraft] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    description: '',
    aircraft_model: '',
    aircraft_type: '',
    registration: '',
    airline: '',
    date: ''
  });

  useEffect(() => {
    loadData();
  }, [filterAircraft]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [photosRes, typesRes] = await Promise.all([
        galleryApi.list({ aircraft_type: filterAircraft || undefined }),
        galleryApi.getTypes()
      ]);
      setPhotos(photosRes.data);
      setAircraftTypes(typesRes.data);
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPhotos = photos.filter(photo => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return photo.description?.toLowerCase().includes(term) ||
           photo.aircraft_model?.toLowerCase().includes(term) ||
           photo.author_name?.toLowerCase().includes(term) ||
           photo.registration?.toLowerCase().includes(term);
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadData.description || !uploadData.aircraft_model || !uploadData.aircraft_type || !uploadData.date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('description', uploadData.description);
      formData.append('aircraft_model', uploadData.aircraft_model);
      formData.append('aircraft_type', uploadData.aircraft_type);
      formData.append('registration', uploadData.registration || '');
      formData.append('airline', uploadData.airline || '');
      formData.append('date', uploadData.date);

      await galleryApi.upload(formData);
      toast.success('Foto enviada com sucesso!');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadData({ description: '', aircraft_model: '', aircraft_type: '', registration: '', airline: '', date: '' });
      loadData();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Erro ao enviar foto';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta foto?')) return;
    try {
      await galleryApi.delete(photoId);
      toast.success('Foto excluída');
      setSelectedPhoto(null);
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir foto');
    }
  };

  const getPhotoUrl = (photo) => {
    if (photo.url?.startsWith('/api')) {
      return `${process.env.REACT_APP_BACKEND_URL}${photo.url}`;
    }
    return photo.url;
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="hero-bg py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-2 mb-6">
                <Camera size={16} className="text-sky-400" />
                <span className="text-sky-300 text-sm font-medium">Registros Aéreos</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Galeria de Fotos</h1>
              <p className="text-gray-300 text-lg">Os melhores registros da nossa comunidade de spotters</p>
            </div>
            
            {user?.approved && (
              <Button onClick={() => setShowUploadModal(true)} className="btn-accent">
                <Upload size={18} className="mr-2" />
                Enviar Foto
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-[#102a43] sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Buscar por aeronave, descrição ou autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#0a1929] border-[#1a3a5c] text-white placeholder-gray-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={filterAircraft}
                onChange={(e) => setFilterAircraft(e.target.value)}
                className="pl-10 pr-8 py-2 bg-[#0a1929] border border-[#1a3a5c] rounded-lg text-white appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="">Todas as aeronaves</option>
                {aircraftTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {(searchTerm || filterAircraft) && (
              <Button
                variant="ghost"
                onClick={() => { setSearchTerm(''); setFilterAircraft(''); }}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} className="mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 bg-[#0a1929]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-400 mb-8">
            Mostrando {filteredPhotos.length} {filteredPhotos.length === 1 ? 'foto' : 'fotos'}
          </p>
          
          {loading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Carregando galeria...</p>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="text-center py-20">
              <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl text-gray-400">Nenhuma foto encontrada</h3>
              <p className="text-gray-500 mt-2">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <div className="photo-grid">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.photo_id}
                  className="photo-card cursor-pointer group"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img 
                    src={getPhotoUrl(photo)} 
                    alt={photo.title || photo.description || photo.aircraft_model} 
                    loading="lazy"
                    onError={(e) => {
                      console.error('Error loading image:', getPhotoUrl(photo));
                      e.target.src = '/logo-spotters-round.png';
                    }}
                  />
                  <div className="photo-overlay">
                    <div className="flex items-center gap-2 mb-2">
                      <Plane size={16} className="text-sky-400" />
                      <span className="text-white font-semibold">{photo.aircraft_model}</span>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-2">{photo.title || photo.description}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {photo.author_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(photo.photo_date || photo.date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Photo Detail Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl bg-[#0a1929] border-[#1a3a5c] text-white">
          {selectedPhoto && (
            <>
              <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
                <img
                  src={getPhotoUrl(selectedPhoto)}
                  alt={selectedPhoto.description}
                  className="w-full h-full object-cover"
                />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl text-white flex items-center gap-2">
                  <Plane className="text-sky-400" />
                  {selectedPhoto.aircraft_model}
                </DialogTitle>
                <DialogDescription className="text-gray-300 text-base">
                  {selectedPhoto.description}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-[#102a43] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Matrícula</p>
                  <p className="text-white font-medium">{selectedPhoto.registration || '-'}</p>
                </div>
                <div className="bg-[#102a43] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Companhia</p>
                  <p className="text-white font-medium">{selectedPhoto.airline || '-'}</p>
                </div>
                <div className="bg-[#102a43] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Data</p>
                  <p className="text-white font-medium">{formatDate(selectedPhoto.date)}</p>
                </div>
                <div className="bg-[#102a43] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Autor</p>
                  <p className="text-white font-medium">{selectedPhoto.author_name}</p>
                </div>
              </div>
              {(user?.role === 'admin_principal' || user?.role === 'admin_authorized' || user?.user_id === selectedPhoto.author_id) && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => handleDeletePhoto(selectedPhoto.photo_id)}
                  >
                    Excluir Foto
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="bg-[#0a1929] border-[#1a3a5c] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Enviar Nova Foto</DialogTitle>
            <DialogDescription className="text-gray-400">
              Preencha todos os campos obrigatórios (*) para enviar sua foto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4 mt-4">
            <div
              className="border-2 border-dashed border-[#1a3a5c] rounded-lg p-6 text-center cursor-pointer hover:border-sky-500/50 transition-colors"
              onClick={() => document.getElementById('photo-upload').click()}
            >
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setUploadFile(e.target.files[0])}
              />
              {uploadFile ? (
                <div>
                  <Camera className="w-10 h-10 text-sky-400 mx-auto mb-2" />
                  <p className="text-white">{uploadFile.name}</p>
                  <p className="text-gray-500 text-sm">Clique para trocar</p>
                </div>
              ) : (
                <div>
                  <Upload className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">Clique para selecionar uma imagem</p>
                  <p className="text-gray-500 text-sm">PNG, JPG até 10MB</p>
                </div>
              )}
            </div>
            
            <Input
              placeholder="Descrição da foto *"
              value={uploadData.description}
              onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
              className="bg-[#102a43] border-[#1a3a5c] text-white"
              required
            />
            <Input
              placeholder="Modelo da aeronave * (ex: Boeing 737-800)"
              value={uploadData.aircraft_model}
              onChange={(e) => setUploadData({...uploadData, aircraft_model: e.target.value})}
              className="bg-[#102a43] border-[#1a3a5c] text-white"
              required
            />
            <select
              value={uploadData.aircraft_type}
              onChange={(e) => setUploadData({...uploadData, aircraft_type: e.target.value})}
              className="w-full px-3 py-2 bg-[#102a43] border border-[#1a3a5c] rounded-lg text-white"
              required
            >
              <option value="">Selecione o tipo de aeronave *</option>
              {aircraftTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <Input
              placeholder="Matrícula (ex: PR-GXJ)"
              value={uploadData.registration}
              onChange={(e) => setUploadData({...uploadData, registration: e.target.value})}
              className="bg-[#102a43] border-[#1a3a5c] text-white"
            />
            <Input
              placeholder="Companhia aérea"
              value={uploadData.airline}
              onChange={(e) => setUploadData({...uploadData, airline: e.target.value})}
              className="bg-[#102a43] border-[#1a3a5c] text-white"
            />
            <Input
              type="date"
              value={uploadData.date}
              onChange={(e) => setUploadData({...uploadData, date: e.target.value})}
              className="bg-[#102a43] border-[#1a3a5c] text-white"
              required
            />
            <Button type="submit" className="w-full btn-accent" disabled={uploading}>
              {uploading ? 'Enviando...' : 'Enviar Foto'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Info messages */}
      {user && !user.approved && (
        <section className="py-8 bg-[#102a43]">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
              <p className="text-amber-300">
                Sua conta está aguardando aprovação. Após aprovado, você poderá enviar fotos para a galeria.
              </p>
            </div>
          </div>
        </section>
      )}

      {!user && (
        <section className="py-8 bg-[#102a43]">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="card-navy p-8">
              <h3 className="text-xl font-semibold text-white mb-3">Quer compartilhar suas fotos?</h3>
              <p className="text-gray-400">Faça login com sua conta Google para solicitar acesso e enviar suas melhores fotos.</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
