import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.table('meals', table => {
        table.uuid('user_id').after('id').index()
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.table('meals', table => {
        table.dropColumn('user_id')
    })
}

