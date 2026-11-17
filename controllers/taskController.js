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
        isCompleted: value.isCompleted,
        priority: value.priority,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(201).json({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
      priority: task.priority,
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
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const whereClause = { userId: global.user_id };

    if(req.query.find){
      whereClause.title = {
        contains: req.query.find,
        mode: "insensitive",
      }; 
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get total count for pagination metadata
    const totalTasks= await prisma.task.count({
      where: whereClause,
    });

    //Build pagination object with complete metadata
    const pagination ={
      page, 
      limit,
      total: totalTasks,
      pages: Math.ceil(totalTasks / limit),
      hasNext: page * limit < totalTasks, 
      hasPrev: page > 1,
    };

    if (tasks.length === 0) {
      return res.status(404).json({
        message: "No tasks found.",
      });
    }

    //Retrun tasks with pagination information
    return res.status(200).json({
      tasks:tasks.map((task) => ({
        id: task.id,
        title: task.title,
        isCompleted: task.isCompleted,
        priority: task.priority,
        createdAt: task.createdAt,
        User: task.User,
      })),
      pagination,
    });
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
        User: {
          select: {
            name: true,
            email: true,
          },
        },
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
      isCompleted: task.isCompleted,
      User: task.User,
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
        priority: true,
      },
    });

    return res.status(200).json({
      id: task.id,
      title: task.title,
      isCompleted: task.isCompleted,
      priority: task.priority,
    });
  } catch (err) {
    if (err.code === "P2025") {
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
      isCompleted: task.isCompleted,
    });
  } catch (err) {
    if (err.code === "P2025"){
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

// Bulk create with validation
const bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;

  // Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ 
      error: "Invalid request data. Expected an array of tasks." 
    });
  }

  // Validate all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || 'medium',
      userId: global.user_id
    });
  }

  // Use createMany for batch insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false
    });

    res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length
    });
  } catch (err) {
    return next(err);
  }
};

exports.bulkCreate = bulkCreate;
