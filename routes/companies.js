const express = require('express');
const db = require('../db');

const router = new express.Router();

router.get('/', async function(req, res, next) {
  // select all companies, returns name,code,description
  try {
    const results = await db.query(
      `SELECT name,code,description FROM companies`
    );
    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.get('/:code', async function(req, res, next) {
  // select a company, returns name,code,description
  try {
    const { code } = req.params;

    const results = await db.query(
      `SELECT code,name,description FROM companies WHERE code=$1`,
      [code]
    );

    return res.json(results.rows);
  } catch (err) {
    return next(err);
  }
});

router.post('/', async function(req, res, next) {
  // add a company, returns code,name,description
  try {
    const { code, name, description } = req.body;
    const result = await db.query(
      `INSERT INTO companies(code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
      [code, name, description]
    );
    return res.json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put('/:code', async function(req, res, next) {
  // update a company row, returns code,name,description
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE companies SET name=$1, description=$2
      WHERE code=$3
      RETURNING code, name, description`,
      [name, description, code]
    );
    return res.json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:code', async function(req, res, next) {
  // delete row at company code, returns delete success message
  try {
    const { code } = req.params;

    let result = await db.query(
      `DELETE FROM companies
      WHERE code=$1
      RETURNING code`,
      [code]
    );

    if (result.rowCount < 1) {
      let err = new Error('Company code does not exist');
      err.status = 404;
      throw err;
    }

    return res.json({ message: 'Deleted' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
