const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

global.users = [];

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

async function register(req, res) {
  if (!req.body) req.body = {};

  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.details.map((detail) => detail.message),
    });
  }

  const hashedPassword = await hashPassword(value.password);

  const user = {
    name: value.name,
    email: value.email,
    hashedPassword,
  };

  global.users.push(user);
  global.user_id = user;

  return res.status(201).json({
    name: user.name,
    email: user.email,
  });
}

async function logon(req, res) {
  if (!req.body) req.body = {};

  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  const user = global.users.find((user) => user.email === email);

  if (user && (await comparePassword(req.body.password, user.hashedPassword))) {
    global.user_id = user;

    return res.status(200).json({
      name: user.name,
      email: user.email,
    });
  }

  return res.status(401).json({
    message: "Invalid email or password",
  });
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
