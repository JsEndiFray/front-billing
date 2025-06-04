//listado y registro de usuarios
export interface User {
  id?: number | null;
  username: string;
  password: string;
  confirm_password?: string
  email: string;
  phone: string;
  role: string;
  date_create?: string;
  date_update?: string;

}

//login
export interface UsersLogin {
  username: string;
  password: string;
}


//token y permisos
export interface token {
  id: number;
  role: 'admin' | 'employee';
  username: string;
}

//acceso al token
export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
