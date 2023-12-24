import axios from "axios";
import { prismaClient } from "../../clients/db";
import JWTService from "../../services/jwt";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";

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

        const user =await prismaClient.user.findUnique({
            where:{email : data.email}
        });

        if(!user) throw new Error("User Not Found");
        
        const userToken  = JWTService.generateUserToken(user);
        return userToken;
    },

    getCurrentUser: async(parent:any, args : any, ctx: GraphqlContext) =>{
        const id = ctx.user?.id
        if(!id) return null

        const user = await prismaClient.user.findUnique({where:{id:id}});

        return user;

    }

    
}

const getUserTweet = {
    User:{
        tweets:(parent:User)=> prismaClient.tweet.findMany({where:{authorId: parent.id}})
    }
}

export const resolvers = {queries , getUserTweet};