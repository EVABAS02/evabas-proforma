import { cn } from '@/lib/utils';

export function Logo({ className, dark = false, size = 'md' }: { className?: string; dark?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-7', md: 'h-9', lg: 'h-12' };
  const monoSize = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' }[size];
  const wordSize = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' }[size];
  return (
    <div className={cn('flex items-center gap-2.5', sizes[size], className)}>
      <div className="relative flex items-center">
        <span
          className={cn('font-display font-black leading-none', monoSize)}
          style={{ background: 'linear-gradient(135deg, hsl(186 94% 50%), hsl(263 70% 58%))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
        >
          E
        </span>
        <span
          className={cn('font-display font-black leading-none -ml-1.5', monoSize)}
          style={{ background: 'linear-gradient(135deg, hsl(263 70% 58%), hsl(186 94% 50%))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
        >
          B
        </span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className={cn('font-script leading-none', wordSize, dark ? 'text-white' : 'text-foreground')}>Eva</span>
        <span className={cn('font-display font-bold uppercase tracking-tight leading-none', wordSize, dark ? 'text-white' : 'text-foreground')}>Bas</span>
      </div>
    </div>
  );
}

export default Logo;
