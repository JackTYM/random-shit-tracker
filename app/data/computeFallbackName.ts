import { CATEGORY_LABELS } from './categoryFormFields';

export function computeFallbackName(
  category: string,
  shared: { manufacturerOrClub: string | null },
  categoryFields: Record<string, unknown>,
): string {
  if (category === 'motor') {
    const designation = (categoryFields.p_designation as string) || (categoryFields.p_impulse_class as string) || '';
    const combined = [shared.manufacturerOrClub, designation].filter(Boolean).join(' ').trim();
    return combined || CATEGORY_LABELS.motor || 'Untitled Item';
  }
  if (category === 'part') {
    const partCategory = (categoryFields.p_part_category as string) || '';
    const partNumber = (categoryFields.p_part_number as string) || '';
    if (partCategory && partNumber) return `${partCategory} — ${partNumber}`;
    return partCategory || partNumber || CATEGORY_LABELS.part || 'Untitled Item';
  }
  if (category === 'other') {
    return (categoryFields.p_type as string) || CATEGORY_LABELS.other || 'Untitled Item';
  }
  return CATEGORY_LABELS[category] ?? 'Untitled Item';
}
