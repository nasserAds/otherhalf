import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
export declare class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void;
}
export declare class WsExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void;
}
