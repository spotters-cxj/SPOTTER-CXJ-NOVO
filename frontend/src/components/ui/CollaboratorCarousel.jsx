import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, ExternalLink } from 'lucide-react';
import { membersApi } from '../../services/api';
import { TagBadgeList } from './TagBadge';

export const CollaboratorCarousel = () => {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollaborators();
  }, []);

  const loadCollaborators = async () => {
    try {
      const response = await membersApi.list();
      // Filter collaborators and above - remove duplicates by user_id
      const collabs = (response.data || []).filter(m => 
        m.tags?.some(t => ['colaborador', 'produtor', 'gestao', 'admin', 'lider', 'vip'].includes(t))
      );
      // Remove duplicates using Map
      const uniqueCollabs = [...new Map(collabs.map(item => [item.user_id, item])).values()];
      setCollaborators(uniqueCollabs);
    } catch (error) {
      console.error('Error loading collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || collaborators.length === 0) {
    return null;
  }

  // Only duplicate if we have enough items for animation
  const displayItems = collaborators.length < 6 
    ? [...collaborators, ...collaborators, ...collaborators]
    : [...collaborators, ...collaborators];

  return (
    <section className="py-12 bg-gradient-to-b from-[#0a1929] to-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <h2 className="text-2xl font-bold text-white">
          Nossos <span className="text-sky-400">Colaboradores</span>
        </h2>
        <p className="text-gray-400 text-sm mt-1">Membros que contribuem ativamente com a comunidade</p>
      </div>

      <div className="relative overflow-hidden">
        <div className="flex collaborator-scroll">
          {displayItems.map((member, index) => (
            <Link
              to={`/perfil/${member.user_id}`}
              key={`collab-${member.user_id}-${index}`}
              className="flex-shrink-0 w-64 mx-3 glass-card glass-card-hover p-6 text-center cursor-pointer transition-transform hover:scale-105"
            >
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <img
                  src={member.picture || '/logo-spotters-round.png'}
                  alt={member.name}
                  className="w-full h-full rounded-full object-cover border-3 border-sky-500/30"
                />
                {/* Badge based on highest role */}
                {member.tags?.includes('lider') && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-black">
                    <span className="text-sm">👑</span>
                  </div>
                )}
                {!member.tags?.includes('lider') && member.tags?.includes('admin') && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center border-2 border-black">
                    <span className="text-sm">🛡️</span>
                  </div>
                )}
                {!member.tags?.includes('lider') && !member.tags?.includes('admin') && member.tags?.includes('vip') && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center border-2 border-black">
                    <span className="text-sm">💎</span>
                  </div>
                )}
                {!member.tags?.includes('lider') && !member.tags?.includes('admin') && !member.tags?.includes('vip') && member.tags?.includes('colaborador') && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center border-2 border-black">
                    <span className="text-sm">⭐</span>
                  </div>
                )}
              </div>
              
              <h3 className="text-white font-semibold">{member.name}</h3>
              
              <div className="mt-2">
                <TagBadgeList tags={member.tags} size="small" maxShow={2} />
              </div>
              
              <div className="flex justify-center gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
                {member.instagram && (
                  <a
                    href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:text-pink-300 transition-colors"
                  >
                    <Instagram size={18} />
                  </a>
                )}
                {member.jetphotos && (
                  <a
                    href={member.jetphotos}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollaboratorCarousel;
