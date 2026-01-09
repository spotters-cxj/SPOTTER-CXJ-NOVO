import React from 'react';
import { Crown, Shield, Star, Users, Camera, Award, CheckCircle } from 'lucide-react';

const tagConfig = {
  lider: {
    label: 'Líder',
    className: 'tag-lider',
    icon: Crown
  },
  admin: {
    label: 'Admin',
    className: 'tag-admin',
    icon: Shield
  },
  gestao: {
    label: 'Gestão',
    className: 'tag-gestao',
    icon: Users
  },
  produtor: {
    label: 'Produtor',
    className: 'tag-produtor',
    icon: Camera
  },
  avaliador: {
    label: 'Avaliador',
    className: 'tag-avaliador',
    icon: CheckCircle
  },
  colaborador: {
    label: 'Colaborador',
    className: 'tag-colaborador',
    icon: Star
  },
  membro: {
    label: 'Membro',
    className: 'tag-membro',
    icon: Users
  },
  vip: {
    label: 'VIP',
    className: 'tag-vip',
    icon: Star
  },
  podio: {
    label: 'Pódio',
    className: 'tag-podio',
    icon: Award
  }
};

export const TagBadge = ({ tag, showIcon = true, size = 'default' }) => {
  const config = tagConfig[tag] || { label: tag, className: 'tag-membro', icon: Users };
  const Icon = config.icon;
  
  const sizeClasses = {
    small: 'text-[10px] px-2 py-0.5',
    default: 'text-xs px-3 py-1',
    large: 'text-sm px-4 py-1.5'
  };

  return (
    <span className={`tag ${config.className} ${sizeClasses[size]} inline-flex items-center gap-1`}>
      {showIcon && <Icon size={size === 'small' ? 10 : size === 'large' ? 14 : 12} />}
      {config.label}
    </span>
  );
};

export const TagBadgeList = ({ tags = [], size = 'default', maxShow = 3 }) => {
  const displayTags = tags.slice(0, maxShow);
  const remaining = tags.length - maxShow;

  return (
    <div className="member-tags">
      {displayTags.map((tag, i) => (
        <TagBadge key={i} tag={tag} size={size} />
      ))}
      {remaining > 0 && (
        <span className="tag tag-membro text-xs">+{remaining}</span>
      )}
    </div>
  );
};

export default TagBadge;
