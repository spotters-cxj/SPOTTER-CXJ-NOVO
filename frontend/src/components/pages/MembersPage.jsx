import React, { useState, useEffect } from 'react';
import { Users, Instagram, ExternalLink, Search, Filter } from 'lucide-react';
import { membersApi } from '../../services/api';
import { TagBadge, TagBadgeList } from '../ui/TagBadge';
import { Input } from '../ui/input';

const hierarchyConfig = {
  lideres: { title: 'Líderes', icon: '👑' },
  admins: { title: 'Administradores', icon: '🛡️' },
  gestao: { title: 'Gestão', icon: '📊' },
  produtores: { title: 'Produtores', icon: '🎬' },
  avaliadores: { title: 'Avaliadores', icon: '✅' },
  colaboradores: { title: 'Colaboradores', icon: '⭐' },
  membros: { title: 'Membros', icon: '👥' }
};

export const MembersPage = () => {
  const [hierarchy, setHierarchy] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await membersApi.getHierarchy();
      setHierarchy(response.data || {});
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = (members) => {
    if (!members) return [];
    return members.filter(m => {
      const matchesSearch = !searchTerm || 
        m.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = !filterTag || m.tags?.includes(filterTag);
      return matchesSearch && matchesTag;
    });
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
            Nossa <span className="gradient-text">Equipe</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Conheça os membros que fazem parte da comunidade Spotters CXJ
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <Input
              placeholder="Buscar membro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10"
            />
          </div>
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 focus:border-sky-500 focus:outline-none"
          >
            <option value="">Todas as tags</option>
            <option value="lider">Líderes</option>
            <option value="admin">Administradores</option>
            <option value="gestao">Gestão</option>
            <option value="produtor">Produtores</option>
            <option value="avaliador">Avaliadores</option>
            <option value="colaborador">Colaboradores</option>
            <option value="spotter_cxj">Spotters CXJ</option>
            <option value="jornalista">Jornalistas</option>
            <option value="diretor_aeroporto">Diretores</option>
          </select>
        </div>

        {/* Hierarchy Sections */}
        {Object.entries(hierarchyConfig).map(([key, config]) => {
          const members = filterMembers(hierarchy[key]);
          if (members.length === 0) return null;

          return (
            <section key={key} className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span>{config.icon}</span>
                {config.title}
                <span className="text-sm font-normal text-gray-500">({members.length})</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="glass-card glass-card-hover member-card"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white/10 mb-3">
                      <img
                        src={member.picture || '/logo-spotters-round.png'}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <h3 className="text-white font-semibold text-sm text-center">
                      {member.name}
                    </h3>
                    
                    <TagBadgeList tags={member.tags} size="small" maxShow={2} />
                    
                    <div className="flex gap-3 mt-3">
                      {member.instagram && (
                        <a
                          href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-400 hover:text-pink-300 transition-colors"
                          title="Instagram"
                        >
                          <Instagram size={16} />
                        </a>
                      )}
                      {member.jetphotos && (
                        <a
                          href={member.jetphotos}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:text-sky-300 transition-colors"
                          title="JetPhotos"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default MembersPage;
