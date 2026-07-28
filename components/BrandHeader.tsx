type BrandHeaderProps = {
  compact?: boolean;
};

export function BrandHeader({ compact = false }: BrandHeaderProps) {
  return (
    <header
      className={`relative z-10 mx-auto w-full max-w-xl ${
        compact ? "pt-3" : "pt-4"
      }`}
    >
      <div className="relative mx-auto w-fit">
        <picture>
          <source srcSet="/boa-corrida-title.webp" type="image/webp" />
          <img
            src="/boa-corrida-title.png"
            alt="A Boa Corrida"
            width={560}
            height={401}
            decoding="async"
            fetchPriority="high"
            className={
              compact
                ? "h-auto w-[60vw] max-w-[210px]"
                : "h-auto w-[64vw] max-w-[250px] sm:max-w-[270px]"
            }
          />
        </picture>

        <picture className="pointer-events-none absolute -bottom-4 right-2 sm:-bottom-5 sm:right-3">
          <source srcSet="/gs-camp-logo.webp" type="image/webp" />
          <img
            src="/gs-camp-logo.png"
            alt="GS Camp"
            width={220}
            height={150}
            decoding="async"
            fetchPriority="high"
            className={compact ? "h-14 w-auto" : "h-16 w-auto sm:h-[72px]"}
          />
        </picture>
      </div>
    </header>
  );
}
