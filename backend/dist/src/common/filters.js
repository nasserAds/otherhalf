"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsExceptionFilter = exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof common_1.HttpException
            ? exception.getResponse()
            : 'Internal server error';
        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
let WsExceptionFilter = class WsExceptionFilter {
    catch(exception, host) {
        const client = host.switchToWs().getClient();
        const message = exception instanceof websockets_1.WsException || exception instanceof common_1.HttpException
            ? exception.message
            : 'Unexpected server error';
        client.emit('error', { message });
    }
};
exports.WsExceptionFilter = WsExceptionFilter;
exports.WsExceptionFilter = WsExceptionFilter = __decorate([
    (0, common_1.Catch)()
], WsExceptionFilter);
//# sourceMappingURL=filters.js.map