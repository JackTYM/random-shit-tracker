export interface CardField {
  key: string;
  label: string;
}

// Keys here match raw item-record column names (unlike categoryFormFields.ts's p_-prefixed RPC params).
export const CATEGORY_CARD_FIELDS: Record<string, CardField[]> = {
  motor: [
    { key: 'impulse_class', label: 'Impulse Class' },
    { key: 'designation', label: 'Designation' },
  ],
  kit: [
    { key: 'length_in', label: 'Overall Length' },
    { key: 'diameter_in', label: 'Body Diameter' },
  ],
  plane: [
    { key: 'wingspan', label: 'Wingspan' },
    { key: 'model_type', label: 'Model Type' },
  ],
  part: [
    { key: 'part_category', label: 'Part Category' },
    { key: 'part_number', label: 'Part Number' },
  ],
  print: [
    { key: 'print_category', label: 'Category' },
    { key: 'year', label: 'Year' },
  ],
  other: [
    { key: 'type', label: 'Type' },
  ],
};
