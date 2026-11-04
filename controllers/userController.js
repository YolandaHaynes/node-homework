const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const pool = require("../db/pg-pool");
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

  try{
    const hashedPassword = await hashPassword(value.password);

    const result = await pool.query(
      `INSERT INTO users (name, email, hashed_password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [value.name, value.email, hashedPassword]
    );

    const user = result.rows[0];

    global.user_id = user.id;

    return res.status(201).json({
      name: user.name,
      email: user.email,
    });
  }

   catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        message: "Email already exists",
      });
    }
    next(err);
  }
}

async function logon(req, res) {
  if (!req.body) req.body = {};

  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  try {
    const result = await pool.query(
      `SELECT id, name, email, hashed_password
       FROM users
       WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (user && password && (await comparePassword(password, user.hashed_password))) {
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
    next(err);
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
