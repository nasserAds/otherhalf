import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { existsSync, readFileSync } from 'fs';
import { config as loadEnv } from 'dotenv';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';

loadEnv();

async function bootstrap() {
  const keyFile = process.env.HTTPS_KEY_FILE;
  const certFile = process.env.HTTPS_CERT_FILE;
  const pfxFile = process.env.HTTPS_PFX_FILE;
  const passphrase = process.env.HTTPS_PFX_PASSPHRASE;
  const httpsOptions =
    pfxFile && existsSync(pfxFile)
      ? {
          pfx: readFileSync(pfxFile),
          passphrase,
        }
      : keyFile && certFile && existsSync(keyFile) && existsSync(certFile)
      ? {
          key: readFileSync(keyFile),
          cert: readFileSync(certFile),
        }
      : undefined;

  const app = await NestFactory.create(AppModule, httpsOptions ? { httpsOptions } : {});
  const config = app.get(ConfigService);

  // Security headers
  app.use(helmet());

  const corsOrigins = config
    .get<string>('CORS_ORIGIN', 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // CORS: only the configured frontend origins may call the API / connect sockets
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Strip unknown properties and reject requests with extra fields —
  // first line of defense against malformed/malicious payloads.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Consistent error response shape across the whole REST API
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`OtherHalf backend listening on ${httpsOptions ? 'https' : 'http'}://localhost:${port}`);
}
bootstrap();
