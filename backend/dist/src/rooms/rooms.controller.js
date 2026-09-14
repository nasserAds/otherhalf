"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsController = void 0;
const common_1 = require("@nestjs/common");
const guards_1 = require("../common/guards");
const decorators_1 = require("../common/decorators");
const rooms_service_1 = require("./rooms.service");
const dto_1 = require("./dto");
let RoomsController = class RoomsController {
    constructor(roomsService) {
        this.roomsService = roomsService;
    }
    create(user, dto) {
        return this.roomsService.createRoom(user.userId, dto);
    }
    join(user, dto) {
        return this.roomsService.joinRoomByCode(user.userId, dto.code);
    }
    listPublic(query) {
        return this.roomsService.listPublicRooms(query.take);
    }
    getByCode(code) {
        return this.roomsService.getRoomByCode(code);
    }
};
exports.RoomsController = RoomsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateRoomDto]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.JoinRoomDto]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "join", null);
__decorate([
    (0, common_1.Get)('public'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ListPublicRoomsDto]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "listPublic", null);
__decorate([
    (0, common_1.Get)(':code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "getByCode", null);
exports.RoomsController = RoomsController = __decorate([
    (0, common_1.Controller)('rooms'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    __metadata("design:paramtypes", [rooms_service_1.RoomsService])
], RoomsController);
//# sourceMappingURL=rooms.controller.js.map