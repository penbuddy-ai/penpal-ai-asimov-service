import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const body = request.body || {};
    const params = request.params || {};
    const query = request.query || {};
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.debug(
          `${method} ${url} +${responseTime}ms - Params: ${JSON.stringify(
            params,
          )} - Query: ${JSON.stringify(query)} - Body: ${
            body && Object.keys(body).length ? JSON.stringify(body) : "empty"
          }`,
        );
      }),
    );
  }
}
