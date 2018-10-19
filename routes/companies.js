const express = require('express');
const db = require('../db');
const slugify = require('slugify');

const router = new express.Router();

router.get('/', async function(req, res, next) {
  // select all companies, returns name,code,description
  try {
    // select all companies
    const results = await db.query(
      `SELECT name,code,description FROM companies`
    );

    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async function(req, res, next) {
  // add a company, returns code,name,description
  try {
    let { code, name, description, industries } = req.body;

    // coerce company code to unicode lowercase
    code = slugify(code, {
      remove: /[*+~.()'"!:@/]/g,
      replacement: '_',
      lower: true
    });

    // insert new company
    const result = await db.query(
      `INSERT INTO companies(code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
      [code, name, description]
    );

    //if industries are passed, insert into industries-companies
    if (!industries) {
      //if no industries were passed, just return the new company
      return res.json(result.rows[0]);
    }

    //if industries were passed...

    //does each industry passed in exist in industries table?
    const industryList = await db.query(`SELECT code FROM industries`);
    let industryArr = industryList.rows;
    let promiseArr = [];
    //iterate through the industries passed in the request body
    for (let ind of industries) {
      //check if each industry exists in the industry table
      if (
        industryArr.some(function(row) {
          return row.code === ind;
        })
      ) {
        //if the industry exists, add an entry to industries_companies
        promiseArr.push(
          db.query(
            `INSERT INTO industries_companies (comp_code, industry_code)
            VALUES ($1, $2)
            RETURNING comp_code, industry_code`,
            [code, ind]
          )
        );
      }
    }
    Promise.all(promiseArr) //do we even need this if we are not doing anything with the results from the join table?
      .then(function(resp) {
        return res.json(result.rows[0]); //should technically edit company data to show industries added, then would need the Promise.all
      })
      .catch(e => console.log(e));
  } catch (err) {
    return next(err);
  }
});

router.put('/:code', async function(req, res, next) {
  // update a company row, returns code,name,description
  try {
    const { code } = req.params;
    const { name, description } = req.body;

    // update company's name and description
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

    // if nothing was deleted, throw error with 404
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

//returns the company and a list of all their invoices
router.get('/:code', async function(req, res, next) {
  try {
    const { code } = req.params;

    // select company
    let compPromise = db.query(
      `SELECT code, name, description FROM companies WHERE code=$1`,
      [code]
    );

    // select invoices for company
    let invoicePromise = db.query(
      `SELECT id, comp_code, amt, paid, add_date, paid_date
      FROM invoices WHERE comp_code=$1`,
      [code]
    );

    // select industries for company
    let industriesPromise = db.query(
      `SELECT industry FROM industries AS i
      JOIN industries_companies AS ic
      ON ic.industry_code=i.code
      WHERE comp_code=$1`,
      [code]
    );

    // resolves all queries then formats and returns results
    Promise.all([compPromise, invoicePromise, industriesPromise]).then(function(
      results
    ) {
      let companyResult = results[0].rows[0];
      companyResult.invoices = results[1].rows;
      companyResult.industries = results[2].rows.map(r => r.industry);

      return res.json({ company: companyResult });
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
