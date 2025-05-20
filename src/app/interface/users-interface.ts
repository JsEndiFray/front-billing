//registro de usuarios
export interface usersRegister {
  id: number | null;
  username: string;
  password: string;
  confirm_password: string
  email: string;
  phone: string;
  role: string;

}

////objeto para el backend
export interface usersRegisterDTO {
  username: string;
  password: string;
  email: string;
  phone: string;
  role: string;

}

//lista de usuarios
export interface userListDTO {
  id: number;
  username: string;
  password: string;
  email: string;
  phone: string;
  role: string;
}

//login
export interface Users {
  username: string;
  password: string;
}

//token
export interface token {
  msg: string;
  data: {
    user: {
      id: number;
      role: string;
      username: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}
