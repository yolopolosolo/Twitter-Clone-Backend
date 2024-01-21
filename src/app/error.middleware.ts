import { NextFunction , Request, Response } from "express";

export const errorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction)=>{
        const errorMessage = 'Internal Server Error';

        res.status(500).json({errors:[{message:errorMessage}]});
    };