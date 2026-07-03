import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, ApiError } from './api-response.model';
export class ApiClient {
  constructor(
    protected http: HttpClient,
    protected baseUrl: string
  ) {}

  protected get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params }).pipe(
      map((response: ApiResponse<T>) => this.unwrapResult(response))
    );
  }

  protected post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, body).pipe(
      map((response: ApiResponse<T>) => this.unwrapResult(response))
    );
  }

  protected put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<ApiResponse<T> | null>(`${this.baseUrl}${path}`, body).pipe(
      map((response: ApiResponse<T> | null) => {
        if (response === null) return undefined as T;
        return this.unwrapResult(response);
      })
    );
  }

  protected delete<T>(path: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`).pipe(
      map((response: ApiResponse<T>) => this.unwrapResult(response))
    );
  }

  private unwrapResult<T>(response: ApiResponse<T>): T {
    if (!response.isSuccess) {
      throw ApiError.fromResponse(response, 400);
    }
    return response.value as T;
  }
}
