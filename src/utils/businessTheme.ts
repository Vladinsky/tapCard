export const DEFAULT_PRIMARY = '#2563eb'

export function businessTheme(value?: string) {
  const primary = value && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_PRIMARY
  const channels = [1, 3, 5].map((start) => {
    const channel = parseInt(primary.slice(start, start + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  return { primary, foreground: luminance > 0.179 ? '#000000' : '#ffffff' }
}
