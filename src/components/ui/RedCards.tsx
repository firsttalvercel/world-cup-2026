export function RedCards({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-[2px] ml-1">
      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-[7px] h-[10px] bg-red-500 rounded-[1.5px] shadow-sm"
          title={`${count} red card${count > 1 ? "s" : ""}`}
        />
      ))}
    </span>
  );
}
