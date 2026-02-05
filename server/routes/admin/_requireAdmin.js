const { requireUser } = require("../../../lib/jwt");

module.exports = function requireAdmin(req) {
  const user = requireUser(req);
  if (!user || user.role !== "admin") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  return user;
};
