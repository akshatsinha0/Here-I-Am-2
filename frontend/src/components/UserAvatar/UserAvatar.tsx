// src/components/UserAvatar/UserAvatar.tsx
import React from 'react';
import './UserAvatar.css';

interface UserAvatarProps {
  src?: string;
  username?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  src, 
  username = '', 
  size = 'md',
  onClick
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    e.currentTarget.nextElementSibling!.style.display = 'flex';
  };

  return (
    <div 
      className={`user-avatar user-avatar-${size}`} 
      onClick={onClick}
      title={username}
    >
      {src && (
        <img 
          src={src} 
          alt={username} 
          className="avatar-image" 
          onError={handleImageError}
        />
      )}
      <div 
        className="avatar-fallback"
        style={{ display: src ? 'none' : 'flex' }}
      >
        {username ? getInitials(username) : ''}
      </div>
    </div>
  );
};

export default UserAvatar;
