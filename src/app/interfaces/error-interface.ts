/*
// Definir posibles tipos para valores adicionales
type ErrorDetailValue = string | number | boolean | string[] | number[] | object | null | undefined;

export interfaces ErrorResponseBase {
  errorCode: string;
  msg?: string;
  duplicated?: string;
}
export interfaces ErrorResponse extends ErrorResponseBase{
  [key: string]: string | ErrorDetailValue | Record<string, ErrorDetailValue>;
}
*/
