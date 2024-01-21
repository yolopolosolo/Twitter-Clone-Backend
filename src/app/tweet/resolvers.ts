import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { S3Client,PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import UserService from "../../services/user";
import TweetService, { CreateTweetData } from "../../services/tweet";


const s3Clinet = new S3Client({
    region: process.env.AWS_DEFAULT_REGION
})

const queries={
    getAllTweets: ()=> TweetService.getAllTweets(),

    getSignedURLForTweet : async(parent:any,{imageName ,imageType}:{imageName:string ,imageType:string},ctx:GraphqlContext)=>{
        if(!ctx.user || !ctx.user.id) throw new Error("User Not Logged In");

        const allowedImageTypes = ['image/jpg','image/jpeg','image/png','image/webp'];
        if(!allowedImageTypes.includes(imageType)) throw new Error("Image type not Supported")

        const putObjectCommand = new PutObjectCommand({
            Bucket:process.env.AWS_S3_BUCKET,
            Key:`upload/${ctx.user.id}/tweet/${imageName}_${Date.now().toString()}`
        })

        const signedURL = await getSignedUrl(s3Clinet,putObjectCommand);

        return signedURL;
    }
}

const mutations={
    createTweet: async (parent:any,{paylaod}:{paylaod: CreateTweetData},ctx:GraphqlContext)=>{

        try{
        if(!ctx.user) throw new Error("Please Login")

        const tweet = await TweetService.createTweet({
            ...paylaod,
            userId: ctx.user.id
        });

        return tweet;
        }
        catch(error){
            throw new Error("Cannot Create Tweet");
        }
    },
};

const userResolverForTweet ={
    Tweet:{
        author:(parent:Tweet)=> UserService.getUserById(parent.authorId)
    }
}

export const resolvers = {mutations , userResolverForTweet,queries};