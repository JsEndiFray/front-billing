//para el formulario de registro
export interface usersRegister {
  id: number | null;
  username: string;
  password: string;
  confirm_password: string
  email: string;
  phone: string;
  role: string;

}

//enviar al Backend
export interface usersRegisterDTO {

  username: string;
  password: string;
  email: string;
  phone: string;
  role: string;

}

//para el login
export interface Users {
  username: string;
  password: string;
}

//token
export interface token {
  msg: string;
  user: {
    id: number;
    role: string;
    username: string;
  };
  accessToken: string;
  refreshToken: string;
}
