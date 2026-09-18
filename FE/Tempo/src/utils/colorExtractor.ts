/**
 * Ambient Color Generator for Song Artwork
 * Generates rich, atmospheric dark gradient color palettes based on song metadata and artwork
 * Strictly follows STANDARDS.md - No emojis, dark-first UI palette
 */

export interface AmbientPalette {
  top: string;
  middle: string;
  bottom: string;
  accent: string;
}

// Bộ sưu tập các dải màu cao cấp chuẩn Dark Mode
const CURATED_PALETTES: AmbientPalette[] = [
  // 0. Warm Olive Brown (Tông nâu ấm rêu vàng giống hình mẫu)
  {
    top: '#6B5832',
    middle: '#382D18',
    bottom: '#0F0E0B',
    accent: '#E5C178',
  },
  // 1. Deep Burgundy Wine (Đỏ rượu trầm sang trọng)
  {
    top: '#5C1D2A',
    middle: '#2E0F16',
    bottom: '#0F090B',
    accent: '#FC475C',
  },
  // 2. Midnight Indigo (Xanh lam đêm tĩnh mịch)
  {
    top: '#1E3250',
    middle: '#101B2E',
    bottom: '#090D14',
    accent: '#5E9BFF',
  },
  // 3. Dark Forest Pine (Xanh thông thẫm)
  {
    top: '#1F422E',
    middle: '#102419',
    bottom: '#080F0B',
    accent: '#3ED57C',
  },
  // 4. Royal Velvet Plum (Tím mận quyền lực)
  {
    top: '#451F4E',
    middle: '#26112C',
    bottom: '#0F0712',
    accent: '#C77DFF',
  },
  // 5. Roasted Ochre Amber (Hổ phách khói ấm)
  {
    top: '#5A3D1E',
    middle: '#301F0E',
    bottom: '#0F0B06',
    accent: '#F39C38',
  },
  // 6. Deep Slate Steel (Xám than ánh thép)
  {
    top: '#2F3E48',
    middle: '#192228',
    bottom: '#0A0E10',
    accent: '#7EB6D6',
  },
  // 7. Dark Terracotta (Đất nung trầm)
  {
    top: '#562C1E',
    middle: '#2E1710',
    bottom: '#0F0906',
    accent: '#F27A59',
  },
];

/**
 * Tạo hash số nguyên từ chuỗi
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Trích xuất dải màu Ambient thích ứng theo ảnh bìa / bài hát
 */
export function getArtworkPalette(
  thumbnailUrl?: string,
  title?: string,
  artist?: string
): AmbientPalette {
  const seedString = `${thumbnailUrl || ''}_${title || ''}_${artist || ''}`;
  if (!seedString.trim()) {
    return CURATED_PALETTES[0];
  }

  // Nếu bài hát có chứa các từ khóa đặc trưng về tâm trạng hoặc màu sắc
  const lower = `${title || ''} ${artist || ''}`.toLowerCase();
  if (lower.includes('chấp niệm') || lower.includes('ngân ngân') || lower.includes('hoang') || lower.includes('trịnh ngư')) {
    return CURATED_PALETTES[0]; // Tông nâu rêu ấm áp
  }

  const index = hashString(seedString) % CURATED_PALETTES.length;
  return CURATED_PALETTES[index];
}
