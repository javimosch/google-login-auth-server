const authMiddleware = (req, res, next) => {
  // Check if user is authenticated (e.g., by verifying a session or JWT)
  // For this example, we'll just check if a user object is in the query params
  const user = req.query.user ? JSON.parse(decodeURIComponent(req.query.user)) : null;
  
  if (user) {
    req.user = user;
    next();
  } else {
    res.redirect('/login');
  }
};

module.exports = authMiddleware;