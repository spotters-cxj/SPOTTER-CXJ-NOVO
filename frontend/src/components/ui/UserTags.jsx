import React from 'react';
import { cn } from '../../lib/utils';

const TAG_STYLES = {
  spotter_cxj: 'tag-spotter-cxj',
  colaborador: 'tag-colaborador',
  vip: 'tag-vip',
  avaliador: 'tag-avaliador',
  jornalista: 'tag-jornalista',
  diretor_aeroporto: 'tag-diretor',
  lider: 'tag-lider',
  admin: 'tag-admin',
  gestao: 'tag-gestao',
  produtor: 'tag-produtor',
  podio: 'tag-podio',
  visitante: 'tag-visitante'
};

const TAG_LABELS = {
  spotter_cxj: 'Spotter CXJ',
  colaborador: 'Colaborador',
  vip: 'VIP',
  avaliador: 'Avaliador',
  jornalista: 'Jornalista',
  diretor_aeroporto: 'Diretor do Aeroporto',
  lider: 'Líder',
  admin: 'Admin',
  gestao: 'Gestão',
  produtor: 'Produtor',
  podio: 'Pódio',
  visitante: 'Visitante'
};

export const UserTag = ({ type, className }) => {
  const style = TAG_STYLES[type] || TAG_STYLES.spotter_cxj;
  const label = TAG_LABELS[type] || type;

  return (
    <span className={cn('tag', style, className)}>
      {label}
    </span>
  );
};

export const UserTags = ({ tags = [], className }) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {tags.map((tag, index) => (
        <UserTag key={`${tag}-${index}`} type={tag} />
      ))}
    </div>
  );
};

// Hierarchy levels for permission checking
export const HIERARCHY_LEVELS = {
  lider: 8,
  admin: 7,
  gestao: 6,
  colaborador: 5,
  vip: 4,
  produtor: 3,
  avaliador: 2,
  jornalista: 2,
  diretor_aeroporto: 2,
  spotter_cxj: 1,
  visitante: 0
};

export const getHighestRole = (tags = []) => {
  let highest = 0;
  let role = 'spotter_cxj';
  
  tags.forEach(tag => {
    const level = HIERARCHY_LEVELS[tag] || 0;
    if (level > highest) {
      highest = level;
      role = tag;
    }
  });
  
  return { role, level: highest };
};

export const canAccess = (userTags = [], requiredLevel) => {
  const { level } = getHighestRole(userTags);
  const required = typeof requiredLevel === 'string' 
    ? HIERARCHY_LEVELS[requiredLevel] || 0 
    : requiredLevel;
  return level >= required;
};
