exports.up = async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('exercises', (table) => {
    table.uuid('id').primary();
    table.string('name').notNullable().unique();
    table.string('muscle_group').notNullable();
    table.string('equipment');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('workout_sessions', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable();
    table.string('title').notNullable();
    table.text('notes');
    table.timestamp('performed_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index(['user_id', 'performed_at']);
  });

  await knex.schema.createTable('session_exercises', (table) => {
    table.uuid('id').primary();
    table.uuid('session_id').notNullable();
    table.uuid('exercise_id');
    table.string('name').notNullable();
    table.text('notes');
    table.integer('position').notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('session_id').references('workout_sessions.id').onDelete('CASCADE');
    table.foreign('exercise_id').references('exercises.id').onDelete('SET NULL');
    table.index(['session_id', 'position']);
  });

  await knex.schema.createTable('session_sets', (table) => {
    table.uuid('id').primary();
    table.uuid('session_exercise_id').notNullable();
    table.integer('set_number').notNullable();
    table.integer('reps').notNullable();
    table.decimal('weight', 10, 2);
    table.integer('rir');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('session_exercise_id').references('session_exercises.id').onDelete('CASCADE');
    table.unique(['session_exercise_id', 'set_number']);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('session_sets');
  await knex.schema.dropTableIfExists('session_exercises');
  await knex.schema.dropTableIfExists('workout_sessions');
  await knex.schema.dropTableIfExists('exercises');
  await knex.schema.dropTableIfExists('users');
};
