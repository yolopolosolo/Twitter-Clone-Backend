import * as dotenv from 'dotenv'
import {initServer} from "./app"
import {errorMiddleware} from "./app/error.middleware"
dotenv.config();

const PORT = process.env.PORT || 8000;

async function init(){
const app = await initServer();
app.listen(PORT,()=> console.log(`Server started at ${PORT}`));
}

init();