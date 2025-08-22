/**
 * Interface para usuarios del sistema
 */
export interface User {
  id?: number | null;
  username: string;
  password: string;
  confirm_password?: string;              // Solo para formularios de registro
  email: string;
  phone: string;
  role: string;                          // 'admin' | 'employee'
  date_create?: string;
  date_update?: string;
}

/**
 * Interface para credenciales de login
 */
export interface UsersLogin {
  username: string;
  password: string;
}

/**
 * Interface para payload del token JWT
 */
export interface token {
  id: number;
  role: 'admin' | 'employee';
  username: string;
}

/**
 * Interface para respuesta de login exitoso
 */
export interface LoginResponse {
  user: User;
  accessToken: string;                   // Token de acceso (15 minutos)
  refreshToken: string;                  // Token de renovación (7 días)
}
