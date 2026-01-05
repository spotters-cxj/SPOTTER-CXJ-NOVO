import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, Check, X, Trash2, Shield, Camera, Settings, RefreshCw } from 'lucide-react';
import { mockUsers, galleryPhotos } from '../../data/mock';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export const AdminPage = ({ user }) => {
  const [users, setUsers] = useState(mockUsers);
  const [photos, setPhotos] = useState(galleryPhotos);

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleApproveUser = (userId) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, approved: true } : u
    ));
  };

  const handleRejectUser = (userId) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, approved: false } : u
    ));
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const pendingUsers = users.filter(u => !u.approved && u.role !== 'admin');
  const approvedUsers = users.filter(u => u.approved);

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
              <p className="text-gray-400">Gerencie usuários e conteúdo do site</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="users" className="space-y-8">
            <TabsList className="bg-[#102a43] border border-[#1a3a5c]">
              <TabsTrigger value="users" className="data-[state=active]:bg-sky-600">
                <Users size={16} className="mr-2" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="photos" className="data-[state=active]:bg-sky-600">
                <Camera size={16} className="mr-2" />
                Fotos
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-sky-600">
                <Settings size={16} className="mr-2" />
                Configurações
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-8">
              {/* Pending Approvals */}
              <div className="card-navy p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <RefreshCw size={20} className="text-amber-400" />
                    Aguardando Aprovação ({pendingUsers.length})
                  </h2>
                </div>
                
                {pendingUsers.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Nenhuma solicitação pendente</p>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((pendingUser) => (
                      <div
                        key={pendingUser.id}
                        className="flex items-center justify-between bg-[#0a1929] rounded-lg p-4 border border-[#1a3a5c]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                            <Users size={20} className="text-amber-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{pendingUser.name}</p>
                            <p className="text-gray-400 text-sm">{pendingUser.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveUser(pendingUser.id)}
                            className="bg-emerald-600 hover:bg-emerald-500"
                          >
                            <Check size={16} className="mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectUser(pendingUser.id)}
                          >
                            <X size={16} className="mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approved Users */}
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
                      {approvedUsers.map((approvedUser) => (
                        <tr key={approvedUser.id} className="border-b border-[#1a3a5c]/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-sky-500/20 rounded-full flex items-center justify-center">
                                <Users size={16} className="text-sky-400" />
                              </div>
                              <span className="text-white">{approvedUser.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-400">{approvedUser.email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              approvedUser.role === 'admin' 
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-sky-500/20 text-sky-400'
                            }`}>
                              {approvedUser.role === 'admin' ? 'Administrador' : 'Contribuidor'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {approvedUser.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(approvedUser.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
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

            {/* Photos Tab */}
            <TabsContent value="photos">
              <div className="card-navy p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Camera size={20} className="text-sky-400" />
                  Gerenciar Fotos ({photos.length})
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="bg-[#0a1929] rounded-lg overflow-hidden border border-[#1a3a5c]">
                      <div className="aspect-video">
                        <img src={photo.url} alt={photo.description} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4">
                        <p className="text-white font-medium text-sm mb-1">{photo.aircraft}</p>
                        <p className="text-gray-400 text-xs mb-2">{photo.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-xs">Por {photo.author}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="card-navy p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Settings size={20} className="text-sky-400" />
                  Configurações do Site
                </h2>
                
                <p className="text-gray-400">
                  As configurações do site serão implementadas com a integração do backend.
                  Aqui você poderá editar textos, links de redes sociais e outras informações.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};
