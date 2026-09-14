"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoomCode = generateRoomCode;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
function generateRoomCode() {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    return code;
}
//# sourceMappingURL=room-code.util.js.map