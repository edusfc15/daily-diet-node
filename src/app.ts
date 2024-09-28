import fastify from 'fastify'
import { mealRoutes } from '../routes/meals'
import cookie from '@fastify/cookie'
import { userRoutes } from '../routes/users'


export const app = fastify()

app.register(cookie)

app.register(mealRoutes, { prefix: '/meals' })
app.register(userRoutes, { prefix: '/users' })