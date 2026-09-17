import { Response } from 'express';

export interface Meta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface PaginatedData<T> {
  items: T[];
  meta: Meta;
}

class SuccessResponse<T = unknown> {
  constructor(
    res: Response,
    message: string,
    data: T | PaginatedData<T> | null = null,
    statusCode: number = 200,
  ) {
    const response: Record<string, unknown> = {
      success: true,
      message,
      statusCode,
    };

    if (data !== null && data !== undefined) {
      const isPaginated =
        Array.isArray((data as PaginatedData<T>).items) &&
        typeof (data as PaginatedData<T>).meta === 'object';

      if (isPaginated) {
        response.meta = (data as PaginatedData<T>).meta;
        response.data = (data as PaginatedData<T>).items;
      } else {
        response.data = data;
      }
    }

    res.status(statusCode).json(response);
  }
}

export default SuccessResponse;