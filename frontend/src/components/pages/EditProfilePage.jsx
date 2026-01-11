import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { Camera, Save, ArrowLeft, Upload, User, Instagram as InstagramIcon, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

export const EditProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    instagram: '',
    jetphotos: '',
    bio: ''
  });
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        instagram: user.instagram || '',
        jetphotos: user.jetphotos || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB');
        return;
      }
      setProfilePictureFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!profilePictureFile) {
      toast.error('Selecione uma foto primeiro');
      return;
    }

    try {
      setUploading(true);
      await authApi.uploadProfilePicture(profilePictureFile);
      toast.success('Foto de perfil atualizada!');
      await refreshUser();
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar foto de perfil');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await authApi.updateProfile(formData);
      toast.success('Perfil atualizado com sucesso!');
      await refreshUser();
      navigate(`/perfil/${user.user_id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.detail || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back button */}
        <Link 
          to={`/perfil/${user.user_id}`} 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar para perfil
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Editar Perfil</h1>
        <p className="text-gray-400 mb-8">Personalize suas informações e redes sociais</p>

        {/* Profile Picture Section */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Camera className="text-sky-400" />
            Foto de Perfil
          </h2>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Current/Preview Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-sky-500/30">
                <img
                  src={profilePicturePreview || user.picture || '/logo-spotters-round.png'}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              </div>
              {profilePicturePreview && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Nova
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 w-full">
              <label className="block">
                <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center cursor-pointer hover:border-sky-500/50 transition-colors">
                  <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-white text-sm mb-1">
                    {profilePictureFile ? profilePictureFile.name : 'Clique para selecionar nova foto'}
                  </p>
                  <p className="text-gray-500 text-xs">JPG, PNG - Máximo 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </label>
              
              {profilePictureFile && (
                <Button
                  onClick={handleUploadProfilePicture}
                  disabled={uploading}
                  className="w-full mt-3 bg-sky-600 hover:bg-sky-500"
                >
                  {uploading ? 'Enviando...' : 'Salvar Foto de Perfil'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <User className="text-sky-400" />
            Informações Pessoais
          </h2>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="text-white font-medium block mb-2">Nome *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome completo"
                required
                className="bg-white/5 border-white/10"
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="text-white font-medium block mb-2 flex items-center gap-2">
                <InstagramIcon size={18} className="text-pink-500" />
                Instagram
              </label>
              <Input
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@seuusuario ou https://instagram.com/seuusuario"
                className="bg-white/5 border-white/10"
              />
              <p className="text-gray-500 text-sm mt-1">
                Digite seu @ ou link completo do Instagram
              </p>
            </div>

            {/* JetPhotos */}
            <div>
              <label className="text-white font-medium block mb-2 flex items-center gap-2">
                <ExternalLink size={18} className="text-sky-500" />
                JetPhotos
              </label>
              <Input
                value={formData.jetphotos}
                onChange={(e) => setFormData({ ...formData, jetphotos: e.target.value })}
                placeholder="https://jetphotos.com/photographer/123456"
                className="bg-white/5 border-white/10"
              />
              <p className="text-gray-500 text-sm mt-1">
                Cole o link completo do seu perfil no JetPhotos
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="text-white font-medium block mb-2">Bio / Descrição</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Conte um pouco sobre você e sua paixão por aviação..."
                className="bg-white/5 border-white/10"
                rows={4}
              />
              <p className="text-gray-500 text-sm mt-1">
                Máximo 500 caracteres
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Button
              type="button"
              onClick={() => navigate(`/perfil/${user.user_id}`)}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-sky-600 hover:bg-sky-500 text-white"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={18} />
                  Salvar Alterações
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
