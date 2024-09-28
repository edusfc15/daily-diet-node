import { FastifyRequest, FastifyReply } from "fastify"

export async function checkUserFromRequest(request : FastifyRequest, reply : FastifyReply) {
    const userId = request.headers['user-id']

    if (!userId) {
        return reply.status(401).send(
            { error: 'Unauthorized' }
        )
    }
}