export type FormFieldType = 'text' | 'number' | 'select' | 'textarea';

export interface CategoryFormField {
  key: string;
  label: string;
  type: FormFieldType;
  options?: string[];
  otherKey?: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  motor: 'Rocket Motor',
  kit: 'Model Rocket Kit',
  plane: 'Model Airplane',
  part: 'Model Rocket Part',
  print: 'Books / Printed Material',
  other: 'Other Collectable',
};

export const CATEGORY_FORM_FIELDS: Record<string, CategoryFormField[]> = {
  motor: [
    { key: 'p_impulse_class', label: 'Impulse Class', type: 'text' },
    { key: 'p_designation', label: 'Designation', type: 'text' },
    { key: 'p_diameter_mm', label: 'Diameter (mm)', type: 'number' },
    { key: 'p_construction', label: 'Construction', type: 'select', options: ['Single-Use', 'Reloadable'] },
    { key: 'p_certification_status', label: 'Certification Status', type: 'select', options: ['Certified', 'Collectable', 'Out of Certification'] },
    { key: 'p_quantity', label: 'Quantity', type: 'number' },
    { key: 'p_propellant_type', label: 'Propellant Type', type: 'select', options: ['BP', 'Composite'] },
  ],
  kit: [
    { key: 'p_motor_diameter_mm', label: 'Motor Diameter (mm)', type: 'number' },
    { key: 'p_diameter_in', label: 'Diameter (in)', type: 'number' },
    { key: 'p_length_in', label: 'Length (in)', type: 'number' },
  ],
  plane: [
    { key: 'p_wingspan', label: 'Wingspan', type: 'text' },
    { key: 'p_model_type', label: 'Model Type', type: 'select', options: ['FF', 'CL', 'RC'] },
    { key: 'p_model_subtype', label: 'Model Subtype', type: 'select', options: ['Rubber', 'Glider', 'Electric', 'Gas', 'Other'], otherKey: 'p_model_subtype_other' },
  ],
  part: [
    { key: 'p_part_category', label: 'Part Category', type: 'select', options: ['Nose Cone', 'Fin Unit', 'Transition', 'Coupler', 'Centering Ring', 'Nose Block', 'Body Tube', 'Parachute', 'Other'], otherKey: 'p_part_category_other' },
    { key: 'p_part_number', label: 'Part Number', type: 'text' },
    { key: 'p_material', label: 'Material', type: 'select', options: ['Plastic', 'Balsa', 'Other'], otherKey: 'p_material_other' },
    { key: 'p_diameter', label: 'Diameter', type: 'text' },
    { key: 'p_origin', label: 'Origin', type: 'select', options: ["Manufacturer's Part", 'Custom'] },
  ],
  print: [
    { key: 'p_print_category', label: 'Category', type: 'select', options: ['Book', 'Catalogue', 'Newsletter', 'Model Plan', 'Educational Material', 'Scale Data', 'Advertising Material'] },
    { key: 'p_year', label: 'Year', type: 'number' },
    { key: 'p_volume_or_issue', label: 'Volume / Issue #', type: 'text' },
    { key: 'p_kit_number', label: 'Kit #', type: 'text' },
  ],
  other: [
    { key: 'p_type', label: 'Type', type: 'text' },
  ],
};
