/* eslint-disable @typescript-eslint/no-explicit-any */

import { EntityManager } from '@mikro-orm/mongodb';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable()
export class FlushInterceptor implements NestInterceptor {
  constructor(private em: EntityManager) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const shouldFlush = !(context.getHandler() as any).doNotFlush;
    return next.handle().pipe(
      mergeMap(async (x) => {
        if (shouldFlush) {
          await this.em.flush();
        }
        return x;
      }),
    );
  }
}
