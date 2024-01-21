import { prismaClient } from "../clients/db"
import { redisClient } from "../clients/redis"

export interface CreateTweetData{
    content: string
    ImageURL?: string
    userId?:string
}

class TweetService{
    public static async getAllTweets(){
        const cachedAllTweets = await redisClient.get("ALL_TWEETS");
        if(cachedAllTweets) return JSON.parse(cachedAllTweets);
        const tweets =await prismaClient.tweet.findMany({orderBy:{createdAt:"desc"}})

        await redisClient.set("ALL_TWEETS", JSON.stringify(tweets));
        return tweets;
    }

    public static async createTweet(data:CreateTweetData){
        
        const rateLimiting = await redisClient.get(`RATE_LIMIT:TWEET:${data.userId}`);

        if(rateLimiting) throw new Error("Please wait..");

        const tweet = await prismaClient.tweet.create({
            data:{
                content:data.content,
                ImageURL: data.ImageURL,
                author:{connect:{id:data.userId}},
            }
        })
        await redisClient.setex(`RATE_LIMIT:TWEET:${data.userId}`, 10, 1);
        await redisClient.del("ALL_TWEETS");

        return tweet;

        }

    public static getUserTweets(id:string){
        return prismaClient.tweet.findMany({where:{authorId: id},orderBy:{createdAt:"desc"}})
    }

}

export default TweetService