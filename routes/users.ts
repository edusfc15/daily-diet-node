import { FastifyInstance } from "fastify";
import { knex } from "../src/database";
import { z } from "zod";

export async function userRoutes(app: FastifyInstance) {

    app.get('/',
        async () => {

            const users = await knex('users').select()

            return {
                users
            }
        }

    )

    app.post('/',
        async (request, reply) => {

            const createUserBodySchema = z.object({
                name: z.string(),
                password: z.string()
            })

            const { name, password } = createUserBodySchema.parse(request.body)

            await knex('users').insert({
                id: crypto.randomUUID(),
                name,
                password
            })

            return reply.status(201).send()
          
        }
    )

    app.get('/:id',
        async (request) => {

            const getUserParamsSchema = z.object({
                id: z.string().uuid()
            })

            const { id } = getUserParamsSchema.parse(request.params)

            const user = await knex('users').where({
                id
            }).first()

            return {
                user
            }
        }
    )
}