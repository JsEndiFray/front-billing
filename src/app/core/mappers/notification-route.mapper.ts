import { NotificationType } from '../../interfaces/stats-interface';

/**
 * Mapa de rutas por tipo de notificación.
 * Fuente de verdad del frontend para navegación desde notificaciones.
 * Para añadir un nuevo tipo: incluirlo en NotificationType y aquí.
 */
export const notificationRouteMap: Record<NotificationType, string> = {
  pending_invoices: '/dashboards/invoices-issued/list',
  overdue_invoices: '/dashboards/invoices-issued/list',
  new_clients:      '/dashboards/clients/list',
};

export function getNotificationRoute(type: NotificationType): string {
  return notificationRouteMap[type] ?? '/dashboards';
}

/**
 * Severidad visual por tipo de notificación.
 * Controla icono y clase CSS en el template.
 */
type NotificationSeverity = 'warning' | 'success' | 'info';

const notificationSeverityMap: Record<NotificationType, NotificationSeverity> = {
  pending_invoices: 'warning',
  overdue_invoices: 'warning',
  new_clients:      'success',
};

export function getNotificationSeverity(type: NotificationType): NotificationSeverity {
  return notificationSeverityMap[type] ?? 'info';
}
