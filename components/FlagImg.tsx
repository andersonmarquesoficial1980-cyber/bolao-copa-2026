import { flagUrl } from "@/lib/flagUrl"

interface Props {
  emoji: string
  alt?: string
  size?: "16" | "20" | "32" | "48" | "64"
  className?: string
}

export function FlagImg({ emoji, alt = "", size = "32", className = "" }: Props) {
  const url = flagUrl(emoji, size)
  const px = Number(size)

  if (!url) {
    return (
      <span style={{ fontSize: size === "32" || size === "48" || size === "64" ? "1.4rem" : "1rem" }}>
        {emoji}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt || emoji}
      width={px}
      height={Math.round(px * 0.75)}
      className={`inline-block object-contain ${className}`}
      style={{ verticalAlign: "middle" }}
    />
  )
}
