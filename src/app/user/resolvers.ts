import axios from "axios";
import { prismaClient } from "../../clients/db";
import JWTService from "../../services/jwt";

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

const queries = {
    verifyGoogleToken: async(parent:any, {token}:{token:string})=>{
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

        const userToken  = await JWTService.generateUserToken(data.email);
        return userToken;
    }
}

export const resolvers = {queries};