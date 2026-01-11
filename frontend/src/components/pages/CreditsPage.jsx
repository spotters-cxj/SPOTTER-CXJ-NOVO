import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Award, Instagram, Heart } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const CreditsPage = () => {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/credits`);
      setCredits(res.data);
    } catch (error) {
      console.error('Error loading credits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar por papel/hierarquia
  const groupedCredits = credits.reduce((acc, member) => {
    const role = member.role || 'Colaborador';
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(member);
    return acc;
  }, {});

  // Ordem de hierarquia
  const roleOrder = ['Fundador', 'Líder', 'Desenvolvedor', 'Designer', 'Produtor', 'Colaborador', 'Apoiador'];
  const sortedRoles = Object.keys(groupedCredits).sort((a, b) => {
    const aIndex = roleOrder.indexOf(a);
    const bIndex = roleOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const getRoleColor = (role) => {
    const colors = {
      'Fundador': 'from-yellow-500 to-amber-600',
      'Líder': 'from-red-500 to-rose-600',
      'Desenvolvedor': 'from-blue-500 to-cyan-600',
      'Designer': 'from-purple-500 to-violet-600',
      'Produtor': 'from-green-500 to-emerald-600',
      'Colaborador': 'from-pink-500 to-rose-500',
      'Apoiador': 'from-gray-500 to-slate-600'
    };
    return colors[role] || 'from-sky-500 to-blue-600';
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
      <div className="max-w-5xl mx-auto px-4">
        {/* Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar para home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 mb-4">
            <Users className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Créditos</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Conheça as pessoas que tornaram este projeto possível. Cada membro contribuiu com
            seu tempo, talento e paixão pela aviação.
          </p>
        </div>

        {/* Credits by Role */}
        {sortedRoles.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Award size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">Nenhum crédito registrado ainda</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedRoles.map((role) => (
              <div key={role} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRoleColor(role)} flex items-center justify-center`}>
                    <Award className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{role}</h2>
                    <p className="text-gray-400 text-sm">{groupedCredits[role].length} {groupedCredits[role].length === 1 ? 'membro' : 'membros'}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {groupedCredits[role].map((member) => (
                    <div 
                      key={member.member_id} 
                      className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-sky-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-semibold text-lg">{member.name}</h3>
                        {member.instagram && (
                          <a
                            href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-400 hover:text-pink-300 transition-colors"
                            title={`Instagram de ${member.name}`}
                          >
                            <Instagram size={20} />
                          </a>
                        )}
                      </div>
                      {member.description && (
                        <p className="text-gray-400 text-sm leading-relaxed">{member.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Thank you message */}
        <div className="mt-12 text-center glass-card p-8">
          <Heart className="text-red-500 mx-auto mb-4" size={48} />
          <h3 className="text-2xl font-bold text-white mb-2">Obrigado!</h3>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Um agradecimento especial a todos que contribuíram direta ou indiretamente
            para o crescimento do Spotters CXJ. Este é um projeto feito com paixão pela
            comunidade de spotters.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreditsPage;
