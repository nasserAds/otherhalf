import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { existsSync, readFileSync } from 'fs';
import { config as loadEnv } from 'dotenv';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';

loadEnv();

// Prisma expects DATABASE_URL. Support the common Neon/Vercel variable names
// as fallbacks so a production deployment cannot silently start without DB config.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.NEON_DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    '';
}

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

  console.log(
    `Database configuration present: ${Boolean(process.env.DATABASE_URL)}`,
  );

  const app = await NestFactory.create(AppModule, httpsOptions ? { httpsOptions } : {});
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/backend');
  app.use(helmet());

  const configuredCorsOrigins = config
    .get<string>('CORS_ORIGIN', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
    .filter(Boolean)
    .map((url) => `https://${url}`);

  const corsOrigins = new Set([
    'http://localhost:3000',
    ...configuredCorsOrigins,
    ...vercelOrigins,
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`OtherHalf backend listening on ${httpsOptions ? 'https' : 'http'}://localhost:${port}`);
}
bootstrap();
