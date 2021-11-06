/** Routes for companies of biztime app */

const express = require("express");
const ExpressError = require("../expressError")
const slugify = require('slugify')
const router = express.Router();
const db = require("../db");

// GET /companies - returns `{companies: [{code, name}, ...]}`
router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`SELECT code, name FROM companies`);
    return res.json({ companies: results.rows })
  } catch (e) {
    return next(e);
  }
})

// GET /companies/[code] - returns {company: {code, name, description, invoices: [id, ...]}}
router.get('/:code', async (req, res, next) => {
    try {
      const { code } = req.params;
      const results = await db.query('SELECT * FROM companies WHERE code = $1', [code]);
      if (results.rows.length === 0) {
        throw new ExpressError(`Can't find a company with the code of ${code}`, 404)
      }
      const invoices = await db.query('SELECT * FROM invoices WHERE comp_code = $1', [code]);
      const company = results.rows[0];
      company.invoices = invoices.rows;
      return res.send({company: company})
    } catch (e) {
      return next(e)
    }
})

//  POST /companies
//  needs to be given JSON like: {code, name, description}, returns {company: {code, name, description}}
router.post('/', async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const code =slugify(name, {lower:true});
      const results = await db.query(
          'INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description',
           [code, name, description]);
      return res.status(201).json({ company: results.rows[0] })
    } catch (e) {
      return next(e)
    }
  })

//  PUT /companies/[code]
//  needs to be given JSON like: {name, description}, returns updated: {company: {code, name, description}}
router.put('/:code', async (req, res, next) => {
    try {
      const { code } = req.params;
      const { name, description } = req.body;
      const results = await db.query(
          'UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description',
          [name, description, code])
      if (results.rows.length === 0) {
        throw new ExpressError(`Can't find a company with the code of ${code}`, 404)
      }
      return res.send({ company: results.rows[0] })
    } catch (e) {
      return next(e)
    }
  })

//  DELETE /companies/[code] -  returns {status: "deleted"}
router.delete('/:code', async (req, res, next) => {
    try {
      const { code } = req.params;  
      console.log("code", code);
      const results = await db.query('DELETE FROM companies WHERE code=$1 RETURNING code', [code])
      if (results.rowCount === 0) {
        throw new ExpressError(`Can't find a company with the code of ${code}`, 404)
      }
      return res.send({ status: "deleted" })
    } catch (e) {
      return next(e)
    }
  })

module.exports = router;
