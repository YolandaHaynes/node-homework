const express = require("express");
const dogsRouter = require("./routes/dogs");
const { randomUUID } = require("crypto");
const path = require("path");

const app = express();

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId})`
  );
  next();
});


app.use(express.json({limit: "1mb"}));

app.use(express.static(path.join(__dirname, "public")));

function checkPostRequest(req,res,next){
    if(req.method === "POST"){
      if (req.get('Content-Type') === 'application/json') {
        return next();
      } else {
        res.status(400).json({
          "error": "Content-Type must be application/json",
          "requestId": `${req.requestId}`,
        });
      }
  }
  next();
}

app.use(checkPostRequest);

app.use("/", dogsRouter);// Do not remove this line

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 400 && statusCode < 500) {
    console.warn(`WARN: ${err.name} - ${err.message}`);
  } else {
    console.error(`ERROR: ${err.name} - ${err.message}`);
  }

  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal Server Error" : err.message,
    requestId: req.requestId,
  });
});

function notFound (req, res, next) {
  res.status(404).json({
    "error": "Route not found",
    "requestId": `${req.requestId}`,
  });
};

app.use(notFound);


function errorHandler(err, req, res, next) {
  res.status(500).json({
    "error": "Internal Server Error",
    "requestId": `${req.requestId}`,
  });
}

app.use(errorHandler);

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;

