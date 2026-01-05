import React, { useState } from 'react';
import { Camera, Calendar, User, Plane, Search, Filter, X, Upload } from 'lucide-react';
import { galleryPhotos } from '../../data/mock';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

export const GalleryPage = ({ user }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAircraft, setFilterAircraft] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const aircraftTypes = [...new Set(galleryPhotos.map(p => p.aircraft))];

  const filteredPhotos = galleryPhotos.filter(photo => {
    const matchesSearch = photo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.aircraft.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterAircraft || photo.aircraft === filterAircraft;
    return matchesSearch && matchesFilter && photo.approved;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Galeria de Fotos
              </h1>
              <p className="text-gray-300 text-lg">
                Os melhores registros da nossa comunidade de spotters
              </p>
            </div>
            
            {user && user.approved && (
              <Button
                onClick={() => setShowUploadModal(true)}
                className="btn-accent"
              >
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
          
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-20">
              <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl text-gray-400">Nenhuma foto encontrada</h3>
              <p className="text-gray-500 mt-2">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <div className="photo-grid">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="photo-card cursor-pointer group"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img src={photo.url} alt={photo.description} loading="lazy" />
                  <div className="photo-overlay">
                    <div className="flex items-center gap-2 mb-2">
                      <Plane size={16} className="text-sky-400" />
                      <span className="text-white font-semibold">{photo.aircraft}</span>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-2">{photo.description}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {photo.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(photo.date)}
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
                  src={selectedPhoto.url}
                  alt={selectedPhoto.description}
                  className="w-full h-full object-cover"
                />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl text-white flex items-center gap-2">
                  <Plane className="text-sky-400" />
                  {selectedPhoto.aircraft}
                </DialogTitle>
                <DialogDescription className="text-gray-300 text-base">
                  {selectedPhoto.description}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-[#102a43] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Matrícula</p>
                  <p className="text-white font-medium">{selectedPhoto.registration}</p>
                </div>
                <div className="bg-[#102a43] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Companhia</p>
                  <p className="text-white font-medium">{selectedPhoto.airline}</p>
                </div>
                <div className="bg-[#102a43] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Data</p>
                  <p className="text-white font-medium">{formatDate(selectedPhoto.date)}</p>
                </div>
                <div className="bg-[#102a43] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Autor</p>
                  <p className="text-white font-medium">{selectedPhoto.author}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Modal - Simplified mock version */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="bg-[#0a1929] border-[#1a3a5c] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Enviar Nova Foto</DialogTitle>
            <DialogDescription className="text-gray-400">
              Preencha todos os campos obrigatórios para enviar sua foto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-[#1a3a5c] rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Clique ou arraste uma imagem</p>
              <p className="text-gray-500 text-sm mt-1">PNG, JPG até 10MB</p>
            </div>
            <Input
              placeholder="Descrição da foto *"
              className="bg-[#102a43] border-[#1a3a5c] text-white"
            />
            <Input
              placeholder="Modelo da aeronave *"
              className="bg-[#102a43] border-[#1a3a5c] text-white"
            />
            <Input
              placeholder="Matrícula (ex: PR-XYZ)"
              className="bg-[#102a43] border-[#1a3a5c] text-white"
            />
            <Input
              placeholder="Companhia aérea"
              className="bg-[#102a43] border-[#1a3a5c] text-white"
            />
            <Input
              type="date"
              className="bg-[#102a43] border-[#1a3a5c] text-white"
            />
            <Button className="w-full btn-accent">
              Enviar Foto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info for non-approved users */}
      {user && !user.approved && (
        <section className="py-8 bg-[#102a43]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="card-navy p-8">
              <h3 className="text-xl font-semibold text-white mb-3">Quer compartilhar suas fotos?</h3>
              <p className="text-gray-400 mb-4">
                Faça login com sua conta Google para solicitar acesso e enviar suas melhores fotos.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
