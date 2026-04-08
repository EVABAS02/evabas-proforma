import { cn } from '@/lib/utils';

const catConfig: Record<string, string> = {
  'Vin': 'bg-cat-vin-bg text-cat-vin',
  'Alimentaire': 'bg-cat-alimentaire-bg text-cat-alimentaire',
  'Infusion & Thé': 'bg-cat-infusion-bg text-cat-infusion',
  'Serviette & Papier': 'bg-cat-serviette-bg text-cat-serviette',
  'Hygiène & Entretien': 'bg-cat-hygiene-bg text-cat-hygiene',
};

export default function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', catConfig[category] || 'bg-muted text-muted-foreground')}>
      {category}
    </span>
  );
}
