"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const fs_1 = require("fs");
const dotenv_1 = require("dotenv");
const app_module_1 = require("./app.module");
const filters_1 = require("./common/filters");
(0, dotenv_1.config)();
async function bootstrap() {
    const keyFile = process.env.HTTPS_KEY_FILE;
    const certFile = process.env.HTTPS_CERT_FILE;
    const pfxFile = process.env.HTTPS_PFX_FILE;
    const passphrase = process.env.HTTPS_PFX_PASSPHRASE;
    const httpsOptions = pfxFile && (0, fs_1.existsSync)(pfxFile)
        ? {
            pfx: (0, fs_1.readFileSync)(pfxFile),
            passphrase,
        }
        : keyFile && certFile && (0, fs_1.existsSync)(keyFile) && (0, fs_1.existsSync)(certFile)
            ? {
                key: (0, fs_1.readFileSync)(keyFile),
                cert: (0, fs_1.readFileSync)(certFile),
            }
            : undefined;
    const app = await core_1.NestFactory.create(app_module_1.AppModule, httpsOptions ? { httpsOptions } : {});
    const config = app.get(config_1.ConfigService);
    app.use((0, helmet_1.default)());
    const corsOrigins = config
        .get('CORS_ORIGIN', 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.enableCors({
        origin: corsOrigins,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new filters_1.HttpExceptionFilter());
    const port = config.get('PORT', 4000);
    await app.listen(port);
    console.log(`OtherHalf backend listening on ${httpsOptions ? 'https' : 'http'}://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map