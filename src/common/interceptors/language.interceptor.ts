import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nService, I18nContext } from 'nestjs-i18n';

export interface Response<T> {
  message: string;
  data: T;
  meta?: any;
}

@Injectable()
export class LanguageInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private readonly i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((response) => {
        const i18nContext = I18nContext.current(context);
        const lang = i18nContext?.lang || 'en';

        console.log('🔄 LanguageInterceptor - Lang:', lang);
        console.log('🔄 LanguageInterceptor - Response:', JSON.stringify(response).substring(0, 100));

        // Si la respuesta ya tiene el formato correcto con message
        if (response && typeof response === 'object' && 'message' in response) {
          const translatedMessage = this.translateMessage(response.message, lang);
          
          console.log('🔤 Original message:', response.message);
          console.log('🔤 Translated message:', translatedMessage);

          return {
            ...response,
            message: translatedMessage,
          };
        }

        // Si la respuesta es data simple, envolver con éxito por defecto
        const successMessage = this.i18n.t('common.success', { lang });
        
        return {
          message: successMessage,
          data: response,
        };
      }),
    );
  }

  private translateMessage(message: string, lang: string): string {
    // Si el mensaje no parece una clave de traducción (no tiene puntos), retornar tal cual
    if (!message || !message.includes('.')) {
      return message;
    }

    try {
      const translated = this.i18n.t(message, { lang }) as string;
      
      // Si la traducción es diferente a la clave original, usar traducción
      // Si es igual, significa que la clave no existe y devolver el original
      return translated !== message ? translated : message;
    } catch (error) {
      console.error('❌ Translation error:', error);
      return message;
    }
  }
}