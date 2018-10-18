const express = require('express');
const db = require('../db');

const router = new express.Router();

router.get('/', async function(req, res, next) {
  try {
    const results = await db.query(
      `SELECT id,comp_code,amt,paid,add_date,paid_date 
      FROM invoices`
    );
    return res.json({ invoices: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async function(req, res, next) {
  try {
    let { id } = req.params;

    let result = await db.query(
      `
      SELECT id,amt,paid,add_date,paid_date, code, name, description
      FROM invoices JOIN companies ON comp_code=companies.code WHERE id=$1`,
      [id]
    );
    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async function(req, res, next) {
  try {
    let { comp_code, amt } = req.body;

    let result = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2)
      RETURNING id,comp_code,amt,paid,add_date,paid_date`,
      [comp_code, amt]
    );

    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
