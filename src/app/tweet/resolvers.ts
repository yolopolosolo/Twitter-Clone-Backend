import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";

interface CreateTweetData{
    content: string
    ImageURL?: string
}

const queries={
    getAllTweets: ()=> prismaClient.tweet.findMany({orderBy:{createdAt:"desc"}})
}

const mutations={
    createTweet: async (parent:any,{paylaod}:{paylaod: CreateTweetData},ctx:GraphqlContext)=>{

        if(!ctx.user) throw new Error("Please Login")

        const tweet = await prismaClient.tweet.create(
            {
                data:{
                    content:paylaod.content,
                    ImageURL: paylaod.ImageURL,
                    author:{connect:{id:ctx.user.id}},
                }
        });

        return tweet;
    },
};

const userResolverForTweet ={
    Tweet:{
        author:(parent:Tweet)=> prismaClient.user.findUnique({where:{id:parent.authorId}})
    }
}

export const resolvers = {mutations , userResolverForTweet,queries};