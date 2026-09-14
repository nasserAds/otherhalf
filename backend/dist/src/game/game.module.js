"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const rooms_module_1 = require("../rooms/rooms.module");
const topics_module_1 = require("../topics/topics.module");
const voting_module_1 = require("../voting/voting.module");
const xp_module_1 = require("../xp/xp.module");
const game_service_1 = require("./game.service");
const game_gateway_1 = require("./game.gateway");
let GameModule = class GameModule {
};
exports.GameModule = GameModule;
exports.GameModule = GameModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, rooms_module_1.RoomsModule, topics_module_1.TopicsModule, voting_module_1.VotingModule, xp_module_1.XpModule],
        providers: [game_service_1.GameService, game_gateway_1.GameGateway],
        exports: [game_service_1.GameService],
    })
], GameModule);
//# sourceMappingURL=game.module.js.map