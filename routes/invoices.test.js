// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testInvoice;

beforeEach(async () => {
    const company_result = await db.query(
        `INSERT INTO companies (code, name, description)
          VALUES ('testcode', 'Test Company', 'Maker of OSX.')
          RETURNING  code, name, description`
        );
    testCompany = company_result.rows[0];
    const invoiceRes = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, paid_date)
          VALUES ('testcode', 300, true, '2018-01-01')
          RETURNING id, comp_code, amt, paid, paid_date, add_date`);
    testInvoice = invoiceRes.rows[0];
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
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

describe("POST /invoices", () => {
    test("Creates a single invoice", async () => {
        const res = await request(app).post('/invoices').send({ comp_code: 'testcode', amt: 500 });
        expect(res.statusCode).toBe(201);
    })
})


describe("GET /invoices/:id", () => {
    test("Get a single invoice", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`)
        expect(res.statusCode).toBe(200);
    })
    test("Responds with 404 for invalid invoice id", async () => {
        const res = await request(app).get(`/invoices/500`)
        expect(res.statusCode).toBe(404);
    })
})

  
describe("PUT /invoices/:id", () => {
    // test("Updates an invoice", async () => {
    //     const res = await request(app).put(
    //         `/invoices/${testInvoice.id}`).send({ amt: 700 });
    //     expect(res.statusCode).toBe(200);
    //     expect(res.body).toEqual({
    //         invoice: {
    //             id: testInvoice.id, comp_code: testInvoice.comp_code, amt: 700, paid: true, add_date: testInvoice.add_date, paid_date: testInvoice.paid_date
    //          }
    //     })
    // })
    test("Updates an invoice", async () => {
        const res = await request(app).put(
            `/invoices/${testInvoice.id}`).send({ amt: 700 });
        expect(res.statusCode).toBe(200);
    })
    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).put(`/invoicees/noid`).send({ amt: 700 });
        expect(res.statusCode).toBe(404);
    })
})


describe("DELETE /invoices/:id", () => {
    test("Delete a single invoice", async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'deleted' })
    })
    test("Respond with error 404 if an invoice not found", async () => {
        const res = await request(app).delete(`/invoices/10`)
        expect(res.statusCode).toBe(404);
    })
})
