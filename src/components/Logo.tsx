import { cn } from '@/lib/utils';
import logoImg from '@/assets/evabas-logo.png';

const SIZE_PX = { sm: 36, md: 48, lg: 80 } as const;

export function Logo({ className, dark = false, size = 'md' }: { className?: string; dark?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-9', md: 'h-12', lg: 'h-20' };
  return (
    <div className={cn('flex items-center', className)}>
      <img
        src={logoImg}
        alt="EVA BAS"
        width={SIZE_PX[size]}
        height={SIZE_PX[size]}
        className={cn(sizes[size], 'w-auto object-contain', dark && 'brightness-0 invert')}
      />
    </div>
  );
}

export default Logo;