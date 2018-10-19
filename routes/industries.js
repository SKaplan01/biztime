const express = require('express');
const db = require('../db');
const slugify = require('slugify');

const router = new express.Router();

router.post('/', async function(req, res, next) {
  try {
    let { code, industry } = req.body;

    let result = await db.query(
      `INSERT INTO industries
      (code, industry) VALUES ($1, $2)
      RETURNING code,industry`,
      [code, industry]
    );

    console.log(result);

    return res.json({ status: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

//returns a list of all industries and the companies associated with each industry
router.get('/', async function(req, res, next) {
  try {
    let result = await db.query(
      `SELECT industry, comp_code FROM industries AS i
      LEFT OUTER JOIN industries_companies AS ic ON i.code=ic.industry_code
      GROUP BY industry, ic.comp_code`
    );

    //creates an array of objects; each obj has industry and comp_code keys
    let industryCompList = result.rows;
    let industryList = {};

    //loop through the list of industry objects (some industries repeat)
    for (let i = 0; i < industryCompList.length; i++) {
      //if this industry is already in the industry list, push company code (if it exists) to company list
      if (industryList[industryCompList[i].industry]) {
        if (industryCompList[i].comp_code) {
          industryList[industryCompList[i].industry].push(
            industryCompList[i].comp_code
          );
        }
      } else {
        //if this industry is not in the industry list, add it and then
        //push company code (if it exists) to company list
        industryList[industryCompList[i].industry] = [];
        if (industryCompList[i].comp_code) {
          industryList[industryCompList[i].industry].push(
            industryCompList[i].comp_code
          );
        }
      }
    }

    return res.json({ industries: industryList });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
