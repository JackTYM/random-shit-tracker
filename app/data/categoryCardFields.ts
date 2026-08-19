export interface CardField {
  key: string;
  label: string;
}

export const CATEGORY_CARD_FIELDS: Record<string, CardField[]> = {
  motor: [
    { key: 'designation', label: 'DESIGNATION' },
    { key: 'diameter_mm', label: 'DIA' },
  ],
  kit: [
    { key: 'diameter_in', label: 'DIA' },
    { key: 'length_in', label: 'LEN' },
  ],
  plane: [
    { key: 'wingspan', label: 'SPAN' },
    { key: 'model_type', label: 'TYPE' },
  ],
  part: [
    { key: 'part_number', label: 'PART #' },
    { key: 'material', label: 'MATERIAL' },
  ],
  print: [
    { key: 'print_category', label: 'CATEGORY' },
    { key: 'year', label: 'YEAR' },
  ],
  other: [
    { key: 'type', label: 'TYPE' },
  ],
};
