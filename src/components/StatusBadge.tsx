import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  brouillon: { label: 'Brouillon', className: 'bg-status-draft-bg text-status-draft' },
  envoyee: { label: 'Envoyée', className: 'bg-status-sent-bg text-status-sent' },
  payee: { label: 'Payée', className: 'bg-status-paid-bg text-status-paid' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.brouillon;
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', config.className)}>
      {config.label}
    </span>
  );
}
