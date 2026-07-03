export interface ApiResponse<T> {
  isSuccess: boolean;
  value?: T;
  errors?: string[];
}

export class ApiError extends Error {
  public readonly errors: string[];
  public readonly statusCode: number;

  constructor(errors: string[], statusCode: number) {
    super(errors.join(','));
    this.name = 'ApiError';
    this.errors = errors;
    this.statusCode = statusCode;
  }

  static fromResponse(response: ApiResponse<unknown>, status: number): ApiError {
    return new ApiError(response.errors ?? [], status);
  }
}