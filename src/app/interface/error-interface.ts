/*
// Definir posibles tipos para valores adicionales
type ErrorDetailValue = string | number | boolean | string[] | number[] | object | null | undefined;

export interface ErrorResponseBase {
  errorCode: string;
  msg?: string;
  duplicated?: string;
}
export interface ErrorResponse extends ErrorResponseBase{
  [key: string]: string | ErrorDetailValue | Record<string, ErrorDetailValue>;
}
*/
