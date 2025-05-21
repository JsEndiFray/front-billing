//listado y registro de usuarios
export interface usersRegister {
  id?: number | null;
  username: string;
  password: string;
  confirm_password: string
  email: string;
  phone: string;
  role: string;
  date_create?: string;
  date_update?: string;

}

////objeto para el backend
export interface usersRegisterDTO {
  username: string;
  password: string;
  email: string;
  phone: string;
  role: string;

}

/*//lista de usuarios
export interface userListDTO {
  id: number;
  username: string;
  password: string;
  email: string;
  phone: string;
  role: string;
}*/

//login
export interface Users {
  username: string;
  password: string;
}

//token y permisos
export interface User {
  id: number;
  role: 'admin' | 'employee';
  username: string;
}


export interface LoginResponse {
  msg: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}
