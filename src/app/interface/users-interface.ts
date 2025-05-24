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
//listado de array de objeto
export interface UsersArray {
  data: User[];
}
//editor de los usuarios
export interface UserEdit {
  data: User;
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

export interface LoginResponse {
  msg: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}
