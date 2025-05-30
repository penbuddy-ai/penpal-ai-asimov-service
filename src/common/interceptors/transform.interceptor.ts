import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export type Response<T> = {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

@Injectable()
export class TransformInterceptor<T>
implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map(data => ({
        statusCode: response.statusCode,
        message: this.getSuccessMessage(request.method),
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }

  private getSuccessMessage(method: string): string {
    switch (method) {
      case "POST":
        return "Resource created successfully";
      case "PUT":
      case "PATCH":
        return "Resource updated successfully";
      case "DELETE":
        return "Resource deleted successfully";
      case "GET":
      default:
        return "Request completed successfully";
    }
  }
}
