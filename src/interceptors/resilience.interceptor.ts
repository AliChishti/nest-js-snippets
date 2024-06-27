import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler
} from '@nestjs/common'
import { Observable, catchError, of, retry, timeout, timer } from 'rxjs'

@Injectable()
export class ResilienceInterceptor implements NestInterceptor {
    constructor(
        // custom options can be passed to modify the behaviour
        private readonly options = {
            retryAttempts: 3,
            retryDelayMs: 3000,
            timeout: 10000
        }
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            // timeout,
            timeout(this.options.timeout),
            // retry
            retry({
                count: this.options.retryAttempts,
                delay: (error) => {
                    // different behaviours can be defined for different errors
                    if (error.status === 403) {
                        // do not retry and throw error
                        throw error
                    }
                    return timer(this.options.retryDelayMs)
                }
            }),
            // fallback
            catchError((error) => {
                return of(error)
            })
        )
    }
}
