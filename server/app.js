import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import userRouter from './routes/user.router.js';
import courseRouter from './routes/course.router.js';
import errorMiddleware from './middleware/error.middleware.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(morgan('dev'));
app.use(cookieParser());

app.use('/api/v1/users',userRouter)
app.use('/api/v1/courses',courseRouter)
app.use('/ping',function(req,res){
  res.send('pong')
});

app.use(errorMiddleware);
app.use((req, res) => {
  res.status(404).send("Route not found");
});


export default app;