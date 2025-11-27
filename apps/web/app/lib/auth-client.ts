import { createAuthClient } from "better-auth/react"


export const {useSession, signIn, signUp} = createAuthClient({
    baseURL: "http://localhost:3000"
}) 
