const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function getImageUrl(photoUrl: string | null | undefined): string {
  if (!photoUrl) {
    return '/images/default-avatar.png';
  }

  // Si l'URL est déjà complète (commence par http)
  if (photoUrl.startsWith('http')) {
    return photoUrl;
  }

  // Si c'est un chemin relatif, construire l'URL complète
  if (photoUrl.startsWith('/')) {
    return `${API_BASE_URL}${photoUrl}`;
  }

  // Sinon, considérer comme un chemin relatif sans /
  return `${API_BASE_URL}/${photoUrl}`;
}

export function getDefaultAvatar(firstName?: string, lastName?: string): string {
  if (firstName && lastName) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(`${firstName} ${lastName}`)}&background=f97316&color=fff&size=128`;
  }
  return '/images/default-avatar.png';
}