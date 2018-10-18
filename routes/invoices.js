const express = require('express');
const db = require('../db');

const router = new express.Router();

//returns a list of all invoices from database
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

//returns a single invoice with given id
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

//creates a new invoice and returns that invoice
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

//updates a single invoice with a given id and returns the updated invoice
router.put('/:id', async function(req, res, next) {
  try {
    let { id } = req.params;
    let { amt, paid } = req.body;
    let result;
    if (paid) {
      let isPaid = await db.query(
        `SELECT paid FROM invoices
        WHERE id=$1`,
        [id]
      );
      if (!isPaid.rows[0].paid) {
        result = await db.query(
          `UPDATE invoices 
            SET amt=$2, paid=$3, paid_date=CURRENT_DATE
            WHERE id=$1
            RETURNING id,comp_code,amt,paid,add_date,paid_date`,
          [id, amt, paid]
        );
      }
    } else {
      result = await db.query(
        `UPDATE invoices 
          SET amt=$2, paid=$3, paid_date=null
          WHERE id=$1
          RETURNING id,comp_code,amt,paid,add_date,paid_date`,
        [id, amt, paid]
      );
    }
    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

//deletes an invoice with the given id and returns a successful delete message
router.delete('/:id', async function(req, res, next) {
  try {
    let { id } = req.params;
    let result = await db.query(
      `DELETE from invoices
      WHERE id=$1
      RETURNING id`,
      [id]
    );
    if (result.rows.length < 1) {
      let err = new Error('invoice id does not exist');
      err.status = 404;
      throw err;
    }

    return res.json({ status: `Deleted invoice number ${id}` });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
