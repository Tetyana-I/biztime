/** Routes for invoices of biztime app */

const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

// GET /invoices
// Returns info on invoices: like {invoices: [{id, comp_code}, ...]}
router.get('/', async (req, res, next) => {
    try {
      const results = await db.query(`SELECT id, comp_code FROM invoices`);
      return res.json({ invoices: results.rows })
    } catch (e) {
      return next(e);
    }
  })

// GET /invoices/[id] - returns `{invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}`
router.get('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const invoiceResults = await db.query('SELECT id, amt, paid, add_date, paid_date, comp_code FROM invoices WHERE id = $1', [id]);
      if (invoiceResults.rows.length === 0) {
        throw new ExpressError(`Can't find an invoice with the id of ${id}`, 404)
      }      
      const companyResults = await db.query('SELECT * FROM companies WHERE code = $1', [invoiceResults.rows[0]["comp_code"]]);
      const invoice = invoiceResults.rows[0];
      invoice.company = companyResults.rows[0];
      delete invoice.comp_code;
      return res.send( invoice );

    } catch (e) {
      return next(e)
    }
})

//  POST /invoices
//  needs to be given JSON like: {comp_code, amt}, returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.post('/', async (req, res, next) => {
    try {
      const { comp_code, amt } = req.body;
      const results = await db.query(
          'INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date',
           [comp_code, amt]);
      return res.status(201).json({ invoice: results.rows[0] })
    } catch (e) {
      return next(e)
    }
  })

//  PUT /invoices/[id]
//  needs to be given in a JSON body of: {amt}, returns updated: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.put('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { amt } = req.body;
      const results = await db.query(
          'UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date',
          [amt, id])
      if (results.rows.length === 0) {
        throw new ExpressError(`Can't find an invoice with the id of ${id}`, 404)
      }
      return res.send({ invoice: results.rows[0] })
    } catch (e) {
      return next(e)
    }
  })

//  DELETE /invoices/[id] -  returns {status: "deleted"}
router.delete('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;  
      const results = await db.query('DELETE FROM invoices WHERE id=$1 RETURNING id', [id])
      if (results.rowCount === 0) {
        throw new ExpressError(`Can't find an invoice with the id of ${id}`, 404)
      }
      return res.send({ status: "deleted" })
    } catch (e) {
      return next(e)
    }
  })

module.exports = router;