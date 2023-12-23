import JWT from 'jsonwebtoken'
import { User } from '@prisma/client';
import { JWTUser } from '../interfaces';

const JWT_Secret = '@twitterClone#Yolo.Saru'

class JWTService {
    public static generateUserToken(user:User){

        const paylaod = {
            id:user?.id,
            email:user?.email,
        };

        const token = JWT.sign(paylaod,JWT_Secret);
        return token;
    };

    public static  getUserByToken(token:string){
        try{
        return JWT.verify(token , JWT_Secret) as JWTUser;
        }
        catch(error){
            return null
        }
    }
}

export default JWTService;