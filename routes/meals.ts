import { FastifyInstance, FastifyRequest } from "fastify"
import { knex } from "../src/database"
import { z } from "zod"
import crypto from 'crypto'
import { checkUserFromRequest } from "./middlewares/check-user-from-request"

export async function mealRoutes(app: FastifyInstance) {

    app.get(
        '/',
        {
            preHandler: [checkUserFromRequest]
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
            preHandler: [checkUserFromRequest]
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
            preHandler: [checkUserFromRequest]
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
            preHandler: [checkUserFromRequest]
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

    const countMeals = async (request: FastifyRequest, condition = {}) => {
        const userId = request.headers['user-id'] as string
        try {
            const result = await knex('meals').count().where(condition).andWhere('user_id', userId);
            
            return result[0]['count(*)']; 
        } catch (error) {
            throw new Error('An error occurred while fetching the metrics.');
        }
    };

    app.get('/total', 
        {
            preHandler: [checkUserFromRequest]
        },
        async (request, reply) => {
        try {
            const total = await countMeals(request);
            reply.send({
                meals: { total },
            });
        } catch (error) {
            console.error('Error fetching total meals:', error);
            reply.status(500).send({ error: 'An error occurred while fetching the total number of meals.' });
        }
    });

    app.get('/total-inside-diet', 
        {
            preHandler: [checkUserFromRequest]
        },
        async (request, reply) => {
        try {
            const total = await countMeals(request, { isInDiet: true }); 
            reply.send({
                meals: { total },
            });
        } catch (error) {
            console.error('Error fetching total meals inside diet:', error);
            reply.status(500).send({ error: 'An error occurred while fetching the total number of meals inside diet.' });
        }
    });

    app.get('/total-outside-diet',
        {
            preHandler: [checkUserFromRequest]
        },
        async (request, reply) => {
        try {
            const total = await countMeals(request, { isInDiet: false }); 
            reply.send({
                meals: { total },
            });
        } catch (error) {
            console.error('Error fetching total meals outside diet:', error);
            reply.status(500).send({ error: 'An error occurred while fetching the total number of meals outside diet.' });
        }
    });

    app.get('/best-sequence-inside-diet',
        {
            preHandler: [checkUserFromRequest]
        },
        async (request, reply) => {
        try {
            const userId = request.headers['user-id'] as string;
            const meals = await knex('meals').where({ user_id: userId, isInDiet: true }).select().orderBy('date', 'asc');
            let bestSequence = 0;
            let currentSequence = 0;
            let lastMealDate = null;
            for (const meal of meals) {
                if (lastMealDate === null) {
                    lastMealDate = meal.date;
                    currentSequence = 1;
                } else {
                    const currentDate = new Date(meal.date);
                    const lastDate = new Date(lastMealDate);
                    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) {
                        currentSequence++;
                    } else {
                        if (currentSequence > bestSequence) {
                            bestSequence = currentSequence;
                        }
                        currentSequence = 1;
                    }
                    lastMealDate = meal.date;
                }
            }
            if (currentSequence > bestSequence) {
                bestSequence = currentSequence;
            }
            reply.send({
                meals: { bestSequence },
            });
        } catch (error) {
            console.error('Error fetching best sequence inside diet:', error);
            reply.status(500).send({ error: 'An error occurred while fetching the best sequence inside diet.' });
        }
    });
}