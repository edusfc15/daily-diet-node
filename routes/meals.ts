import { FastifyInstance } from "fastify"
import { knex } from "../src/database"
import { z } from "zod"
import crypto from 'crypto'
import { checkUserFromRequest } from "./middlewares/check-user-from-request"

export async function mealRoutes(app: FastifyInstance) {

    app.get(
        '/', 
        { 
            preHandler : [ checkUserFromRequest] 
        } 
        , async (request) => {

        const userId = request.headers?.['user-id']

        const meals = await knex('meals')
        .where('user_id', userId)
        .select()
        return {
            meals
        }
    })

    app.get(
        '/:id',
        { 
            preHandler : [ checkUserFromRequest] 
        } 
        ,
         async (request) => {
        const getMealParamsSchema = z.object({
            id: z.string().uuid(),
        })

        const userId = request.headers['user-id'] as string

        const { id } = getMealParamsSchema.parse(request.params)
        const meal = await knex('meals').where({
            id,
            user_id: userId
        }).first()
        return {
            meal
        }
    })

    app.patch(
        '/:id',
        { 
            preHandler : [ checkUserFromRequest] 
        } 
        ,
        async (request, reply) => {
        const updateMealBodySchema = z.object({
            name: z.string().optional(),
            description: z.string().optional(),
            date: z.string().optional(),
            time: z.string().optional(),
            isInDiet: z.boolean().optional()
        })

        const userId = request.headers['user-id'] as string

        if (!userId) {
            return reply.status(401).send()
        }

        const { name, description, date, time, isInDiet } = updateMealBodySchema.parse(request.body)
        const { id } = request.params as { id: string }

        await knex('meals').where({
            id,
            user_id: userId
        }).update({
            name,
            description,
            date,
            time,
            isInDiet
        })

        return reply.status(204).send()
    })

    app.delete(
        '/:id',
        { 
            preHandler : [ checkUserFromRequest] 
        } 
        ,
        async (request, reply) => {
        const deleteMealParamsSchema = z.object({
            id: z.string().uuid()
        })

        const userId = request.headers['user-id'] as string

        if (!userId) {
            return reply.status(401).send()
        }

        const { id } = deleteMealParamsSchema.parse(request.params)

        await knex('meals').where({
            id,
            user_id: userId
        }).delete()

        return reply.status(204).send()
    })

    app.post(
        '/', 
        async (request, reply) => {
            
        const createMealBodySchema = z.object({
            name: z.string(),
            description: z.string(),
            date: z.string(),
            time: z.string(),
            isInDiet: z.boolean()
        })

        const { name, description, date, time, isInDiet } = createMealBodySchema.parse(request.body)

        const userId = request.headers['user-id'] as string

        if (!userId) {
            return reply.status(401).send()
        }

        await knex('meals').insert({
            id: crypto.randomUUID(),
            name,
            description,
            date,
            time,
            isInDiet,
            user_id: userId
        })

        return reply.status(201).send()

    })
}