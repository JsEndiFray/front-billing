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
