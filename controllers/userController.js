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

  let user = null;

  try {
    user = await prisma.user.create({
      data: {
        name: value.name,
        email: value.email,
        hashedPassword: value.hashedPassword,
      },
      select: { name: true, email: true, id: true },
    });
  } catch (err) {
    if (
      err.name === "PrismaClientKnownRequestError" &&
      err.code === "P2002"
    ) {
      return res.status(400).json({
        message: "Email already exists",
      });
    } else {
      return next(err);
    }
  }

  global.user_id = user.id;

  return res.status(201).json({
    name: user.name,
    email: user.email,
  });
}

async function logon(req, res, next) {
  if (!req.body) req.body = {};

  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
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