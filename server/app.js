import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import authRouter from './routes/auth.route.js'
import userRouter from './routes/user.route.js'
import roleRouter from './routes/role.route.js'


//routes declaration
app.use("/api/v1/auth", authRouter)
app.use("/api/v1/user", userRouter)
app.use("/api/v1/role", roleRouter)


// http://localhost:8000/api/v1/users/register

export { app }