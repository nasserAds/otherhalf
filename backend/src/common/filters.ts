import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Response } from 'express';
import { Socket } from 'socket.io';

// Normalizes every REST error into one predictable shape, so the frontend
// never has to special-case Nest's default vs. custom exception formats.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Gateways never throw raw errors at the socket — that can crash the
// connection. Instead, every caught exception becomes a clean `error` event
// the client can render (e.g. a toast), and the connection stays alive.
@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client: Socket = host.switchToWs().getClient();
    const message =
      exception instanceof WsException || exception instanceof HttpException
        ? exception.message
        : 'Unexpected server error';

    client.emit('error', { message });
  }
}
