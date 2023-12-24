export const types = `#graphql

    input CreateTweetData{
        content: String!
        ImageURL: String

    }

    type Tweet {
        id: ID!
        content: String!
        ImageURL: String
        author: User
    }
`;