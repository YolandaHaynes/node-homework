const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");


const create = async (req, res) => {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

 try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title)
       VALUES ($1, $2)
       RETURNING id, title, is_completed`,
      [global.user_id, value.title]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
  console.error("Could not create task:", err);
  return res.status(500).json({
    message: "Could not create task.",
  });
}
};

exports.create = create;

const index = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, is_completed
       FROM tasks
       WHERE user_id = $1
       ORDER BY id`,
      [global.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "No tasks found.",
      });
    }

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Could not fetch tasks:", err);
    return res.status(500).json({
      message: "Could not fetch tasks.",
    });
  }
};

exports.index = index;

const show = async(req, res) => {
  const taskId = Number.parseInt(req.params?.id, 10);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

    try {
    const result = await pool.query(
      `SELECT id, title, is_completed
       FROM tasks
       WHERE id = $1 AND user_id = $2`,
      [taskId, global.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Could not fetch task:", err);
    return res.status(500).json({
      message: "Could not fetch task.",
    });
  }
};

exports.show = show;

const update = async (req, res) => {
  if (!req.body) req.body = {};

  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const taskId = Number.parseInt(req.params?.id, 10);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  const fields = Object.keys(value);

  if (fields.length === 0) {
    return res.status(400).json({
      message: "No task fields were provided to update.",
    });
  }

  const allowedColumns = {
    title: "title",
    isCompleted: "is_completed",
  };

  try {
    const values = fields.map((field) => value[field]);
    const setClause = fields
      .map((field, index) => `${allowedColumns[field]} = $${index + 1}`)
      .join(", ");

    values.push(taskId, global.user_id);

    const result = await pool.query(
      `UPDATE tasks
       SET ${setClause}
       WHERE id = $${values.length - 1}
         AND user_id = $${values.length}
       RETURNING id, title, is_completed`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Could not update task:", err);
    return res.status(500).json({
      message: "Could not update task.",
    });
  }
};

exports.update = update;


const deleteTask = async (req, res) => {
  const taskId = Number.parseInt(req.params?.id, 10);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM tasks
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, is_completed`,
      [taskId, global.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Could not delete task:", err);
    return res.status(500).json({
      message: "Could not delete task.",
    });
  }
};

exports.deleteTask = deleteTask;


