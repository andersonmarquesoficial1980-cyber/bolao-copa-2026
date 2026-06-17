/**
 * Converte emoji de bandeira para URL de imagem via flagcdn.com
 * Evita o problema de emojis regionais não renderizando em Windows/Android antigo
 */

// Mapa emoji → código ISO 3166-1 alpha-2
const EMOJI_TO_CODE: Record<string, string> = {
  "🇦🇹": "at", "🇦🇷": "ar", "🇦🇺": "au", "🇧🇦": "ba",
  "🇧🇪": "be", "🇧🇷": "br", "🇨🇦": "ca", "🇨🇩": "cd",
  "🇨🇭": "ch", "🇨🇮": "ci", "🇨🇴": "co", "🇨🇻": "cv",
  "🇨🇼": "cw", "🇨🇿": "cz", "🇩🇪": "de", "🇩🇿": "dz",
  "🇪🇨": "ec", "🇪🇬": "eg", "🇪🇸": "es", "🇫🇷": "fr",
  "🇬🇭": "gh", "🇭🇷": "hr", "🇭🇹": "ht", "🇮🇶": "iq",
  "🇮🇷": "ir", "🇯🇴": "jo", "🇯🇵": "jp", "🇰🇷": "kr",
  "🇲🇦": "ma", "🇲🇽": "mx", "🇳🇱": "nl", "🇳🇴": "no",
  "🇳🇿": "nz", "🇵🇦": "pa", "🇵🇹": "pt", "🇵🇾": "py",
  "🇶🇦": "qa", "🇸🇦": "sa", "🇸🇪": "se", "🇸🇳": "sn",
  "🇹🇳": "tn", "🇹🇷": "tr", "🇺🇸": "us", "🇺🇾": "uy",
  "🇺🇿": "uz", "🇿🇦": "za",
  // Bandeiras subdivisão (Inglaterra, Escócia) — sem suporte CDN, usa emoji mesmo
  "🏴": "",
}

/**
 * Retorna URL da imagem de bandeira para o emoji dado.
 * Se não tiver mapeamento, retorna null (usar emoji como fallback).
 */
export function flagUrl(emoji: string, _size?: string): string | null {
  const code = EMOJI_TO_CODE[emoji?.trim()]
  if (code === undefined || code === "") return null
  // Usa arquivo local em /public/flags/ — sem dependência externa
  return `/flags/${code}.png`
}
