import axios from "axios";
import { prismaClient } from "../../clients/db";
import JWTService from "../../services/jwt";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";
import TweetService from "../../services/tweet";
import { redisClient } from "../../clients/redis";



const queries = {
    verifyGoogleToken: async(parent:any, {token}:{token:string})=>{
        const userToken = await UserService.verifyGoogleAuthToken(token);
        return  userToken;
    },

    getCurrentUser: async(parent:any, args : any, ctx: GraphqlContext) =>{
        const id = ctx.user?.id
        if(!id) return null

        const user = await UserService.getUserById(id);

        return user;

    },

    getUserById: async (parent:any, {id}:{id:string},ctx:GraphqlContext)=>{
        const user = await UserService.getUserById(id);
        return user;
    }

    
}

const extraResolvers = {
    User:{
        tweets:(parent:User)=> TweetService.getUserTweets(parent.id),
        follower:async (parent:User)=> {
            const result = await prismaClient.follows.findMany(
            {
                where:{following:{id:parent.id}},
                include:{
                    follower:true
                }
            });

            return result.map(el=>el.follower);
        },
        following: async (parent:User)=>{
            const result = await prismaClient.follows.findMany(
            {
                where:{follower:{id:parent.id}},
                include:{
                    following:true
                }
            });

            return result.map(el=>el.following);
        },
        recommendedUsers: async(parent: User, _:any ,ctx:GraphqlContext)=>{
            if(!ctx.user) return [];

            const cachedRecommendedUsers = await redisClient.get(
                `RECOMMENDED_USERS:${ctx.user.id}`
                );

            if(cachedRecommendedUsers) return JSON.parse(cachedRecommendedUsers);

            const myFollowing = await prismaClient.follows.findMany(
                {
                    where: {
                        follower: {
                            id: ctx.user.id
                        }
                    },
                    include: {
                        following:{
                            include:{follower:{include:{following:true}}
                        }}
                    }

                });

                const users : User[] = []
                for(const following of myFollowing){
                   for(const followingOfFollowedUser of following.following.follower){
                        if( followingOfFollowedUser.following.id !== ctx.user.id &&
                            myFollowing.findIndex(e=>e.followingId == followingOfFollowedUser.followingId) == -1){
                            if(users.findIndex(x=>x.id == followingOfFollowedUser.followingId)==-1){
                                users.push(followingOfFollowedUser.following)
                            }
                        } 
                    }
                }

                await redisClient.setex(`RECOMMENDED_USERS:${ctx.user.id}`,60, JSON.stringify(users));

                return users;
        }
    }
}

const mutations = {
    followUser: async (parent:any,{to}:{to:string},ctx:GraphqlContext)=>{
        if(!ctx.user) throw new Error("Please Login")

        await UserService.followUser(ctx.user.id, to);

        await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true
    },

    unFollowUser: async (parent:any,{to}:{to:string},ctx:GraphqlContext)=>{
        if(!ctx.user) throw new Error("Please Login")

        await UserService.unFollowUser(ctx.user.id, to);
        await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true
    }
}

export const resolvers = {queries , extraResolvers, mutations};