exports.up = async function (knex) {
  await knex.schema.createTable('profiles', (table) => {
    table.increments('id').primary();
    table
      .enu('name', ['Male', 'Female'], {
        useNative: true,
        enumName: 'profile_name_enum',
      })
      .notNullable()
      .unique();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('exercises', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('muscle_group').notNullable();
    table.boolean('is_compound').defaultTo(false).notNullable();
    table.timestamps(true, true);
    table.unique(['name']);
  });

  await knex.schema.createTable('workouts', (table) => {
    table.increments('id').primary();
    table
      .integer('profile_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('profiles')
      .onDelete('CASCADE');
    table.string('name').notNullable();
    table.date('scheduled_for').notNullable();
    table.timestamps(true, true);
    table.index(['profile_id', 'scheduled_for']);
  });

  await knex.schema.createTable('workout_exercises', (table) => {
    table.increments('id').primary();
    table
      .integer('workout_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('workouts')
      .onDelete('CASCADE');
    table
      .integer('exercise_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('exercises')
      .onDelete('CASCADE');
    table.integer('order_index').defaultTo(0).notNullable();
    table.timestamps(true, true);
    table.index(['workout_id', 'order_index']);
  });

  await knex.schema.createTable('prescriptions', (table) => {
    table.increments('id').primary();
    table
      .integer('workout_exercise_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('workout_exercises')
      .onDelete('CASCADE');
    table.integer('set_number').notNullable();
    table.integer('target_reps').notNullable();
    table.decimal('target_weight', 6, 2).notNullable();
    table.integer('rir').nullable();
    table.string('tempo').nullable();
    table.timestamps(true, true);
    table.index(['workout_exercise_id', 'set_number']);
  });

  await knex.schema.createTable('sessions', (table) => {
    table.increments('id').primary();
    table
      .integer('profile_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('profiles')
      .onDelete('CASCADE');
    table
      .integer('workout_id')
      .unsigned()
      .references('id')
      .inTable('workouts')
      .onDelete('SET NULL');
    table.timestamp('started_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('ended_at').nullable();
    table.text('notes').nullable();
    table.timestamps(true, true);
    table.index(['profile_id', 'started_at']);
  });

  await knex.schema.createTable('session_sets', (table) => {
    table.increments('id').primary();
    table
      .integer('session_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('sessions')
      .onDelete('CASCADE');
    table
      .integer('exercise_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('exercises')
      .onDelete('CASCADE');
    table.integer('set_number').notNullable();
    table.integer('actual_reps').nullable();
    table.decimal('actual_weight', 6, 2).nullable();
    table.timestamps(true, true);
    table.unique(['session_id', 'exercise_id', 'set_number']);
    table.index(['session_id', 'exercise_id']);
  });

  await knex.schema.createTable('bodyweight_logs', (table) => {
    table.increments('id').primary();
    table
      .integer('profile_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('profiles')
      .onDelete('CASCADE');
    table.date('logged_at').notNullable();
    table.decimal('bodyweight', 5, 2).notNullable();
    table.timestamps(true, true);
    table.unique(['profile_id', 'logged_at']);
  });

  await knex.schema.createTable('settings', (table) => {
    table.string('key').primary();
    table.text('value').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('settings');
  await knex.schema.dropTableIfExists('bodyweight_logs');
  await knex.schema.dropTableIfExists('session_sets');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('prescriptions');
  await knex.schema.dropTableIfExists('workout_exercises');
  await knex.schema.dropTableIfExists('workouts');
  await knex.schema.dropTableIfExists('exercises');
  await knex.schema.dropTableIfExists('profiles');
};
