export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const ApiResponseBuilder = {
  success<T>(data: T, message = 'Success', meta?: PaginationMeta): ApiSuccessResponse<T> {
    return { success: true, data, message, meta };
  },

  created<T>(data: T, message = 'Created'): ApiSuccessResponse<T> {
    return { success: true, data, message };
  },

  error(statusCode: number, code: string, message: string, details?: unknown): ApiErrorResponse {
    return { success: false, error: { code, message, details } };
  },
};
