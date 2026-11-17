const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const prisma = require("../db/prisma");

const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);

  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const derivedKey = await scrypt(inputPassword, salt, 64);

  return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
}

async function register(req, res, next) {
  if (!req.body) req.body = {};

  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.details.map((detail) => detail.message),
    });
  }

  value.hashedPassword = await hashPassword(value.password);
  delete value.password;

  const {email, name, hashedPassword} = value;

  let user = null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, name, hashedPassword },
        select: { id: true, email: true, name: true, createdAt: true }
      });

      const welcomeTaskData = [
        { title: "Complete your profile", userId: newUser.id, priority: "medium" },
        { title: "Add your first task", userId: newUser.id, priority: "high" },
        { title: "Explore the app", userId: newUser.id, priority: "low" }
      ];

      await tx.task.createMany({ data: welcomeTaskData });

      //Fetch the created tasks to return them
      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map(t => t.title) }
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
          createdAt: true
        }
      });

      return { user: newUser, welcomeTasks };
    });

    // Store the user ID globally for session management (not secure for production)
    global.user_id = result.user.id;

    //Send response with status 201
    res.status(201);
    res.json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: 'success'
    });
    return;

  } catch (err) {
    if (err.code === "P2002") {
      //send the appropriate error back -- the email was already registered
      return res.status(400).json({
        message: "Email already registered",
      });
    } else {
      return next(err); // the error handler takes care of the errors
    }
  }
}

async function logon(req, res, next) {
  if (!req.body) req.body = {};

  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        hashedPassword: true 
      },
    });

    if (
      user &&
      password &&
      (await comparePassword(password, user.hashedPassword))
    ) {
      global.user_id = user.id;

      return res.status(200).json({
        name: user.name,
        email: user.email,
      });
    }

    return res.status(401).json({
      message: "Invalid email or password",
    });
  } catch (err) {
    return next(err);
  }
}

function logoff(req, res) {
  global.user_id = null;
  res.status(200).json({
    message: "You have logged off successfully",
  });
}

module.exports = {
  register,
  logon,
  logoff,
};