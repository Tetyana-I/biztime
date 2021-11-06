// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testInvoice;

beforeEach(async () => {
    const invoiceRes = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, paid_date)
          VALUES ('newcode', 300, true, '2018-01-01')
          RETURNING id, comp_code, amt, paid, paid_date, add_date`);
    testInvoice = invoiceRes.rows[0];
})

afterEach(async () => {
    await db.query(`DELETE FROM invoices`);
})

afterAll(async () => {
    await db.end()
})

describe("GET /invoices", () => {
    test("Get a list of invoices", async () => {
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ invoices: [{ id: testInvoice.id, comp_code: testInvoice.comp_code }] })
    })
})


describe("DELETE /invoices/:id", () => {
    test("Delete a single invoice", async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'deleted' })
    })
    test("Respond with error 404 if an invoice not found", async () => {
        const res = await request(app).delete(`/invoices/5`)
        expect(res.statusCode).toBe(404);
    })
})
