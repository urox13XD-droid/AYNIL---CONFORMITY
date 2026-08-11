import Image from "next/image";

export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <div className="inline-flex shrink-0 items-center gap-2 select-none">
      <Image
        src="/aynil-logo.png"
        alt="AYNIL"
        width={256}
        height={256}
        priority
        className="h-9 w-9 shrink-0 rounded-md"
      />
      <div className="flex flex-col items-center">
        <span className="font-display text-2xl leading-none">AYNIL</span>
        {subtitle && (
          <div className="mt-1 rounded-sm bg-black px-1.5 py-0.5 text-center text-[9px] font-bold tracking-[0.25em] text-white">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
