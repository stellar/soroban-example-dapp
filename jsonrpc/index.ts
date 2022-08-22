export type Id = string | number;

export type Request<T, E = any> = {
  jsonrpc: "2.0";
  id: Id;
  method: string;
  params: T;
};

export type Notification<T, E = any> = {
  jsonrpc: "2.0";
  method: string;
  params?: T;
};

export type Response<T, E = any> = {
  jsonrpc: "2.0";
  id: Id;
} & (
  { error: Error<E> }
| { result: T });

export type Error<E = any> = {
  code: number;
  message?: string;
  data?: E;
};
