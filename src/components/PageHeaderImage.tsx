type PageHeaderImageProps = {
  src: string | null | undefined
  alt: string
}

const FRAME_CLASS =
  "aspect-[2/1] w-full rounded-2xl border-2 border-ink shadow-[6px_6px_0_var(--color-ink)]"

export function PageHeaderImage({ src, alt }: PageHeaderImageProps) {
  if (src === null) return null

  return (
    <div className="hidden lg:block">
      {src ? (
        <img src={src} alt={alt} className={`${FRAME_CLASS} object-cover`} />
      ) : (
        <div className={`${FRAME_CLASS} animate-pulse bg-cream`} />
      )}
    </div>
  )
}
