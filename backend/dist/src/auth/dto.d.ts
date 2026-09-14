import { Avatar } from '@prisma/client';
export declare class RegisterDto {
    username: string;
    avatar: Avatar;
}
export declare class LoginDto {
    username: string;
    deviceSecret: string;
}
