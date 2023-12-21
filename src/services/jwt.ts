import JWT from 'jsonwebtoken'
import { prismaClient } from "../clients/db";
import { User } from '@prisma/client';

const JWT_Secret = '@twitterClone#Yolo.Saru'

class JWTService {
    public static async  generateUserToken(email:string){
        const user  = await prismaClient.user.findUnique({
            where:{email: email}
        });

        const paylaod = {
            id:user?.id,
            email:user?.email,
        };

        const token = JWT.sign(paylaod,JWT_Secret);
        return token;
    };
}

export default JWTService;