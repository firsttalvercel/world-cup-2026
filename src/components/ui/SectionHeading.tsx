import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  centered?: boolean;
}

export function SectionHeading({
  title,
  subtitle,
  className,
  centered = false,
}: SectionHeadingProps) {
  return (
    <div className={cn(centered && "text-center", className)}>
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
