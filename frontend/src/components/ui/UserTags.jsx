import React from 'react';
import { cn } from '../../lib/utils';

const TAG_STYLES = {
  colaborador: 'tag-colaborador',
  vip: 'tag-vip',
  avaliador: 'tag-avaliador',
  membro: 'tag-membro',
  lider: 'tag-lider',
  admin: 'tag-admin',
  gestao: 'tag-gestao',
  produtor: 'tag-produtor',
  podio: 'tag-podio'
};

const TAG_LABELS = {
  colaborador: 'Colaborador',
  vip: 'VIP',
  avaliador: 'Avaliador',
  membro: 'Membro',
  lider: 'Líder',
  admin: 'Admin',
  gestao: 'Gestão',
  produtor: 'Produtor',
  podio: 'Pódio'
};

export const UserTag = ({ type, className }) => {
  const style = TAG_STYLES[type] || TAG_STYLES.membro;
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
  lider: 7,
  admin: 6,
  gestao: 5,
  produtor: 4,
  avaliador: 3,
  colaborador: 2,
  membro: 1
};

export const getHighestRole = (tags = []) => {
  let highest = 0;
  let role = 'membro';
  
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
