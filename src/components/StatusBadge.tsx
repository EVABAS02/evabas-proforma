import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  brouillon: { label: 'Brouillon', className: 'bg-status-draft-bg text-status-draft' },
  envoyé: { label: 'Envoyé', className: 'bg-status-sent-bg text-status-sent' },
  validé: { label: 'Validé', className: 'bg-status-valid-bg text-status-valid' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.brouillon;
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
