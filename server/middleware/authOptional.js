const jwt = require("jsonwebtoken");

exports.authOptional = (req, res, next) => {
  let token = null;

  // Token por query
  if (req.query.token) token = req.query.token;

  // Token estándar por headers
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return next(); // permite PDF público

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch {}

  next();
};
