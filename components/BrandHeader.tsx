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
      <div className="relative mx-auto w-fit bg-transparent">
        {/* Native img avoids Next/Image loading box flash around transparent PNGs */}
        <img
          src="/boa-corrida-title.png"
          alt="A Boa Corrida"
          width={900}
          height={420}
          decoding="async"
          fetchPriority="high"
          className={`translate-x-1 bg-transparent [filter:drop-shadow(0_6px_10px_rgba(0,0,0,0.35))] sm:translate-x-1.5 ${
            compact
              ? "h-auto w-[60vw] max-w-[210px]"
              : "h-auto w-[64vw] max-w-[250px] sm:max-w-[270px]"
          }`}
        />

        <img
          src="/gs-camp-logo.png"
          alt="GS Camp"
          width={160}
          height={160}
          decoding="async"
          fetchPriority="high"
          className={`pointer-events-none absolute -bottom-4 right-2 bg-transparent [filter:drop-shadow(0_4px_8px_rgba(0,0,0,0.4))] sm:-bottom-5 sm:right-3 ${
            compact ? "h-14 w-auto" : "h-16 w-auto sm:h-[72px]"
          }`}
        />
      </div>
    </header>
  );
}
