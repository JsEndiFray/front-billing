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
