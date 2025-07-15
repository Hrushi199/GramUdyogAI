import { Link } from 'react-router-dom';

interface PublicProfileAvatarProps {
  userId: number | string;
  name: string;
  avatarUrl?: string;
  size?: number;
}

export default function PublicProfileAvatar({ userId, name, avatarUrl, size = 40 }: PublicProfileAvatarProps) {
  // Fallback to initials if no avatarUrl
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <Link to={`/profile/${userId}`} style={{ display: 'inline-block', lineHeight: 0 }}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          title={name}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid #a78bfa',
            background: '#f3f4f6',
          }}
          onError={e => {
            (e.target as HTMLImageElement).src = '/default-avatar.png';
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: '#a78bfa',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: size / 2,
            border: '2px solid #a78bfa',
            userSelect: 'none',
          }}
          title={name}
        >
          {initials}
        </div>
      )}
    </Link>
  );
} 