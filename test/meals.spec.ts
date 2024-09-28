import { it, beforeAll, afterAll, describe, expect , beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'

describe('Meals', () => {

    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        execSync('npm run knex -- migrate:rollback --all')
        execSync('npm run knex -- migrate:latest')
    }
    )

    it('should be able to create a new meal', async () => {
        await request(app.server).post('/meals').send({
            name: 'Arroz',
            description: 'Arroz branco',
            date: '2022-01-01',
            time: '12:00',
            isInDiet: true
        }).expect(201)

    }
    )

    it('should be able to list all meals', async () => {

        const createMealResponse = await request(app.server).post('/meals').send({
            name: 'Arroz',
            description: 'Arroz branco',
            date: '2022-01-01',
            time: '12:00',
            isInDiet: true
        })

        const cookie = createMealResponse.headers['set-cookie']

        const listMealResponse = await request(app.server).get('/meals')
        .set('Cookie', cookie)
        .expect(200)

        expect(listMealResponse.body.meals).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: 'Arroz',
                    description: 'Arroz branco',
                    date: '2022-01-01',
                    time: '12:00',
                    isInDiet: 1
                })
            ])
        )
    }
    )

    it.only('should be able to list a specific meal', async () => {

        const createMealResponse = await request(app.server).post('/meals').send({
            name: 'Arroz',
            description: 'Arroz branco',
            date: '2022-01-01',
            time: '12:00',
            isInDiet: true
        })

        const cookie = createMealResponse.headers['set-cookie']

        const listMealResponse = await request(app.server).get('/meals')
        .set('Cookie', cookie)
        .expect(200)

        const mealId = listMealResponse.body.meals[0].id 

        const getMealResponse = await request(app.server).get(`/meals/${mealId}`)
        .set('Cookie', cookie)
        .expect(200)

        expect(getMealResponse.body.meal).toEqual(
                expect.objectContaining({
                    name: 'Arroz',
                    description: 'Arroz branco',
                    date: '2022-01-01',
                    time: '12:00',
                    isInDiet: 1
                })  
        )
    }
    )

    
})
