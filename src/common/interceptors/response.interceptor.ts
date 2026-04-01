import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: unknown) => {
        const hasData = data && typeof data === 'object' && 'data' in data;
        const hasMessage =
          data && typeof data === 'object' && 'message' in data;

        return {
          success: true,
          data: (hasData ? (data as { data: T }).data : data) as T,
          message: hasMessage
            ? (data as { message: string }).message
            : undefined,
        };
      }),
    );
  }
}
