/** BizTime express application. */

const express = require('express');
const app = express();
app.use(express.json());
const iRoutes = require('./routes/invoices');
const cRoutes = require('./routes/companies');
const indRoutes = require('./routes/industries');

app.use('/companies', cRoutes);
app.use('/invoices', iRoutes);
app.use('/industries', indRoutes);

/** 404 handler */

app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});

module.exports = app;
