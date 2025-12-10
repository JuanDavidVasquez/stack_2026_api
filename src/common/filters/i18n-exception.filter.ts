import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';

/**
 * Filtro de excepciones que traduce automáticamente los mensajes de error
 */
@Catch(HttpException)
export class I18nExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const i18n = I18nContext.current(host);

    const exceptionResponse = exception.getResponse();
    let message: string | string[];

    // Extraer el mensaje de la excepción
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
      message = (exceptionResponse as any).message;
    } else {
      message = this.getDefaultErrorMessage(status, i18n?.lang || 'en');
    }

    // Si el mensaje es una clave de traducción, traducirlo
    const translatedMessage = Array.isArray(message)
      ? message.map(msg => this.translateIfKey(msg, i18n))
      : this.translateIfKey(message, i18n);

    response.status(status).json({
      statusCode: status,
      message: translatedMessage,
      error: this.getErrorType(status, i18n?.lang || 'en'),
      timestamp: new Date().toISOString(),
      language: i18n?.lang || 'en',
    });
  }

  private translateIfKey(message: string, i18n: I18nContext | undefined): string {
    // Si el mensaje contiene puntos, probablemente es una clave de traducción
    if (message.includes('.') && i18n) {
      try {
        const translated = i18n.translate(message) as string;
        // Si la traducción es diferente a la clave, usar la traducción
        return translated !== message ? translated : message;
      } catch {
        return message;
      }
    }
    return message;
  }

  private getDefaultErrorMessage(status: number, lang: string): string {
    const errorKeys: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'errors.badRequest',
      [HttpStatus.UNAUTHORIZED]: 'errors.unauthorized',
      [HttpStatus.FORBIDDEN]: 'errors.forbidden',
      [HttpStatus.NOT_FOUND]: 'errors.notFound',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'errors.internalError',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'errors.serviceUnavailable',
      [HttpStatus.TOO_MANY_REQUESTS]: 'errors.tooManyRequests',
    };

    return errorKeys[status] || 'errors.internalError';
  }

  private getErrorType(status: number, lang: string): string {
    const errorTypes: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
    };

    return errorTypes[status] || 'Error';
  }
}