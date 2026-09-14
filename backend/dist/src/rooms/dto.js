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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListPublicRoomsDto = exports.JoinRoomDto = exports.CreateRoomDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateRoomDto {
}
exports.CreateRoomDto = CreateRoomDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(4),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], CreateRoomDto.prototype, "maxPlayers", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.DebateMode),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "debateMode", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.RoomVisibility),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "visibility", void 0);
class JoinRoomDto {
}
exports.JoinRoomDto = JoinRoomDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    __metadata("design:type", String)
], JoinRoomDto.prototype, "code", void 0);
class ListPublicRoomsDto {
}
exports.ListPublicRoomsDto = ListPublicRoomsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], ListPublicRoomsDto.prototype, "take", void 0);
//# sourceMappingURL=dto.js.map