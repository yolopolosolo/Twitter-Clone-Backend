import axios from "axios";
import { prismaClient } from "../clients/db";
import JWTService from "./jwt";
import { redisClient } from "../clients/redis";

interface GoogleToken {
    iss?: string;
    nbf?: string;
    aud?: string;
    sub?: string;
    email: string;
    email_verified: string;
    azp?: string;
    name?: string;
    picture?: string;
    given_name: string;
    family_name?: string;
    iat?: string;
    exp?: string;
    jti?: string;
    alg?: string;
    kid?: string;
    typ?: string;
}

class UserService{
    public static async verifyGoogleAuthToken(token:string){
        const googleTokenId = token;
        const googleOAuthUrl = new URL('https://oauth2.googleapis.com/tokeninfo');
        googleOAuthUrl.searchParams.set('id_token',googleTokenId);

        const {data} = await axios.get<GoogleToken>(googleOAuthUrl.toString(),{
            responseType:'json'
        });

        const isUserRegistered =await prismaClient.user.findUnique({
            where:{email : data.email}
        });

        if(!isUserRegistered){
            await prismaClient.user.create({
                data:{
                    email: data.email,
                    firstName: data.given_name,
                    lastName: data.family_name,
                    profileImageUrl: data.picture
                }
            });
        }

        const user =await prismaClient.user.findUnique({
            where:{email : data.email}
        });

        if(!user) throw new Error("User Not Found");
        
        const userToken  = JWTService.generateUserToken(user);
        return userToken;
    }

    public static async getUserById(id:string){
       
        const user = prismaClient.user.findUnique({
            where:{id:id}
        }
        );
        return user;

    }

    public static followUser(from: string, to:string){
        return prismaClient.follows.create(
            {
                data:{
                    follower:{connect:{id:from}},
                    following:{connect:{id:to}}
                }
            }
        )
    }

    public static unFollowUser(from:string , to:string){
        return prismaClient.follows.delete({
            where:{followerId_followingId:{followerId:from,followingId:to}}
        })
    }
}

export default UserService;