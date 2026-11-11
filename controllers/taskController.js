const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");
const create = async (req, res) => {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: value.title,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(201).json({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
    });
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
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id,
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (tasks.length === 0) {
      return res.status(404).json({
        message: "No tasks found.",
      });
    }

    return res.status(200).json(
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        is_completed: task.isCompleted,
      }))
    );
  } catch (err) {
    console.error("Could not fetch tasks:", err);
    return res.status(500).json({
      message: "Could not fetch tasks.",
    });
  }
};

exports.index = index;

const show = async (req, res) => {
  const taskId = Number.parseInt(req.params?.id, 10);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      id: task.id,
      title: task.title,
      is_completed: task.isCompleted,
    });
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

  try {
    const task = await prisma.task.update({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      data: value,
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(200).json({
      id: task.id,
      title: task.title,
      is_completed: task.isCompleted,
    });
  } catch (err) {
    if (
      err.name === "PrismaClientKnownRequestError" &&
      err.code === "P2025"
    ) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

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
    const task = await prisma.task.delete({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(200).json({
      id: task.id,
      title: task.title,
      is_completed: task.isCompleted,
    });
  } catch (err) {
    if (
      err.name === "PrismaClientKnownRequestError" &&
      err.code === "P2025"
    ) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    console.error("Could not delete task:", err);
    return res.status(500).json({
      message: "Could not delete task.",
    });
  }
};

exports.deleteTask = deleteTask;

