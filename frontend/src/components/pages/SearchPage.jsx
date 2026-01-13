import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Camera, Instagram, ExternalLink, Filter } from 'lucide-react';
import { membersApi } from '../../services/api';
import { TagBadge, TagBadgeList } from '../ui/TagBadge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const AVAILABLE_TAGS = [
  { value: 'lider', label: 'Líder', icon: '👑' },
  { value: 'admin', label: 'Admin', icon: '🛡️' },
  { value: 'gestao', label: 'Gestão', icon: '📊' },
  { value: 'produtor', label: 'Produtor', icon: '🎬' },
  { value: 'avaliador', label: 'Avaliador', icon: '✅' },
  { value: 'colaborador', label: 'Colaborador', icon: '⭐' },
  { value: 'vip', label: 'VIP', icon: '💎' },
  { value: 'spotter_cxj', label: 'Spotter CXJ', icon: '✈️' },
  { value: 'jornalista', label: 'Jornalista', icon: '📰' },
  { value: 'diretor_aeroporto', label: 'Diretor do Aeroporto', icon: '🏢' },
];

export const SearchPage = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, selectedTags, members]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await membersApi.list();
      setMembers(response.data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = members;

    // Filter by search term (name or email)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.name?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term) ||
        m.instagram?.toLowerCase().includes(term)
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(m =>
        selectedTags.some(tag => m.tags?.includes(tag))
      );
    }

    setFilteredMembers(filtered);
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
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
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            <span className="gradient-text">Buscar</span> Membros
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Encontre membros da comunidade Spotters CXJ pelo nome ou tags
          </p>
        </div>

        {/* Search Bar */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, email ou Instagram..."
                className="pl-12 py-3 bg-[#102a43] border-[#1a3a5c] text-white text-lg"
              />
            </div>
            {(searchTerm || selectedTags.length > 0) && (
              <Button variant="outline" onClick={clearFilters} className="border-gray-600">
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Tag Filters */}
          <div>
            <label className="text-gray-400 text-sm mb-3 flex items-center gap-2">
              <Filter size={16} />
              Filtrar por tags
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => toggleTag(tag.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTags.includes(tag.value)
                      ? 'bg-sky-500 text-white'
                      : 'bg-[#102a43] text-gray-400 hover:bg-[#1a3a5c]'
                  }`}
                >
                  {tag.icon} {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            {filteredMembers.length} membro{filteredMembers.length !== 1 ? 's' : ''} encontrado{filteredMembers.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Results Grid */}
        {filteredMembers.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">Nenhum membro encontrado</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Link
                key={member.user_id}
                to={`/perfil/${member.user_id}`}
                className="glass-card glass-card-hover p-6 text-center transition-transform hover:scale-105"
              >
                <div className="w-24 h-24 mx-auto mb-4 relative">
                  <img
                    src={member.picture || '/logo-spotters-round.png'}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover border-3 border-white/10"
                  />
                  {/* Badge */}
                  {member.tags?.includes('lider') && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-[#0a1929]">
                      <span>👑</span>
                    </div>
                  )}
                  {!member.tags?.includes('lider') && member.tags?.includes('vip') && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-2 border-[#0a1929]">
                      <span>💎</span>
                    </div>
                  )}
                </div>

                <h3 className="text-white font-semibold text-lg mb-2">{member.name}</h3>
                
                <div className="mb-4">
                  <TagBadgeList tags={member.tags} size="small" maxShow={3} />
                </div>

                <div className="flex justify-center gap-3" onClick={(e) => e.preventDefault()}>
                  {member.instagram && (
                    <a
                      href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:text-pink-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Instagram size={18} />
                    </a>
                  )}
                  {member.jetphotos && (
                    <a
                      href={member.jetphotos}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
