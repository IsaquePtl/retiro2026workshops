import Image from "next/image";

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
        <Image
          src="/boa-corrida-title.png"
          alt="A Boa Corrida"
          width={900}
          height={420}
          priority
          className={`translate-x-1 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] sm:translate-x-1.5 ${
            compact
              ? "h-auto w-[60vw] max-w-[210px]"
              : "h-auto w-[64vw] max-w-[250px] sm:max-w-[270px]"
          }`}
        />

        <Image
          src="/gs-camp-logo.png"
          alt="GS Camp"
          width={160}
          height={160}
          priority
          className={`pointer-events-none absolute -bottom-4 right-2 drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)] sm:-bottom-5 sm:right-3 ${
            compact ? "h-14 w-auto" : "h-16 w-auto sm:h-[72px]"
          }`}
        />
      </div>
    </header>
  );
}
