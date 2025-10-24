//PARA FACTURAS RECIVIDAS (RECEIVED-PAYMENT)

export const PAYMENT_STATUS_LABELS = [
  {value: 'pending', label: 'Pendiente'},
  {value: 'paid', label: 'Pagado'},
  {value: 'overdue', label: 'Vencida'},
  {value: 'disputed', label: 'Disputada'},
];

export const PAYMENT_METHOD_LABELS = [
  {value: 'transfer', label: 'Transferencia'},
  {value: 'direct_debit', label: 'Domiciliado'},
  {value: 'cash', label: 'Efectivo'},
  {value: 'card', label: 'Tarjeta'},
  {value: 'check', label: 'Cheque'}
];


//PARA FACTURAS EMITIDAS (ISSUED-COLLECTED)

export const COLLECTION_STATUS_LABELS = [
  {value: 'pending', label: 'Pendiente'},
  {value: 'collected', label: 'Cobrado'},
  {value: 'overdue', label: 'Vencida'},
  {value: 'disputed', label: 'Disputada'},
];

export const COLLECTION_METHOD_LABELS = [
  {value: 'transfer', label: 'Transferencia'},
  {value: 'direct_debit', label: 'Domiciliado'},
  {value: 'cash', label: 'Efectivo'},
  {value: 'card', label: 'Tarjeta'},
  {value: 'check', label: 'Cheque'}
];


// ========================================
// Facturación proporcional
// ========================================
export const BILLING_TYPE_LABELS = [
  { value: 0, label: 'Mes completo' },
  { value: 1, label: 'Proporcional por días' }
]


export const CATEGORIES_LABELS = [
  {value: 'electricidad', label: 'Electricidad'},
  {value: 'gas', label: 'Gas'},
  {value: 'agua', label: 'Agua'},
  {value: 'comunidad', label: 'Comunidad'},
  {value: 'seguros', label: 'Seguros'},
  {value: 'residuos', label: 'Residuos'},
  {value: 'mantenimiento', label: 'Mantenimiento'},
  {value: 'reparaciones', label: 'Reparaciones'},
  {value: 'materiales', label: 'Materiales'},
  {value: 'otros', label: 'Otros'},
  {value: 'telefono', label: 'Teléfono'},
  {value: 'internet', label: 'Internet'},
  {value: 'limpieza', label: 'Limpieza'},
  {value: 'seguridad', label: 'Seguridad'},
  {value: 'impuestos', label: 'Impuestos'},
  {value: 'servicios_profesionales', label: 'Servicios Profesionales'},
  {value: 'suministros', label: 'Suministros'},
  {value: 'mobiliario', label: 'Mobiliario'}
];

// ========================================
// Para clientes
// ========================================
export const CLIENT_TYPES_LABELS = [
  { value: 'particular', label: 'Particular' },
  { value: 'autonomo', label: 'Autónomo' },
  { value: 'empresa', label: 'Empresa' }
];


// ========================================
// Para suppliers (proveedores)
// ========================================
export const ACTIVE_STATUS_LABELS = [
  { value: true, label: 'Activo' },
  { value: false, label: 'Inactivo' }
];

export const PAYMENT_TERMS_LABELS = [
  { value: 0, label: 'Pago inmediato' },
  { value: 15, label: '15 días' },
  { value: 30, label: '30 días' },
  { value: 45, label: '45 días' },
  { value: 60, label: '60 días' },
  { value: 90, label: '90 días' }
];

// ========================================
// Para gastos internos (Internal Expenses)
// ========================================

export const EXPENSE_CATEGORY_LABELS = [
  { value: 'office_supplies', label: 'Material de Oficina' },
  { value: 'equipment_furniture', label: 'Equipamiento y Mobiliario' },
  { value: 'professional_services', label: 'Servicios Profesionales' },
  { value: 'utilities', label: 'Suministros (Luz, Agua, Gas)' },
  { value: 'maintenance_repairs', label: 'Mantenimiento y Reparaciones' },
  { value: 'travel_transport', label: 'Viajes y Transporte' },
  { value: 'marketing_advertising', label: 'Marketing y Publicidad' },
  { value: 'training_education', label: 'Formación y Educación' },
  { value: 'insurance', label: 'Seguros' },
  { value: 'taxes_fees', label: 'Impuestos y Tasas' },
  { value: 'rent_leasing', label: 'Alquiler y Leasing' },
  { value: 'technology_software', label: 'Tecnología y Software' },
  { value: 'legal_accounting', label: 'Legal y Contabilidad' },
  { value: 'other', label: 'Otros' }
];

export const EXPENSE_STATUS_LABELS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'paid', label: 'Pagado' }
];

export const EXPENSE_PAYMENT_METHOD_LABELS = [
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'check', label: 'Cheque' },
  { value: 'financing', label: 'Financiación' }
];

export const EXPENSE_RECURRENCE_LABELS = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'annually', label: 'Anual' }
];

export const DEDUCTIBLE_LABELS = [
  { value: true, label: 'Deducible' },
  { value: false, label: 'No deducible' }
];
