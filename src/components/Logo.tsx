export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <div className="inline-flex shrink-0 flex-col select-none">
      <img
        src="/aynil-logo.svg"
        alt="AYNIL"
        width={1000}
        height={1000}
        className="h-9 w-9 shrink-0 rounded-md"
      />
      {subtitle && (
        <div className="mt-1 rounded-sm bg-black px-1.5 py-0.5 text-center text-[9px] font-bold tracking-[0.25em] text-white">
          {subtitle}
        </div>
      )}
    </div>
  );
}
