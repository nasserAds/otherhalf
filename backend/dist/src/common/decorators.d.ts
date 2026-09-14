export interface AuthUser {
    userId: string;
    username: string;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
