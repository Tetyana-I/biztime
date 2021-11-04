// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;

beforeEach(async () => {
    const company_result = await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple Computer', 'Maker of OSX.') RETURNING  code, name, description`
        );
    testCompany = company_result.rows[0];
    const invoice_res = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, paid_date)
         VALUES ('apple', 100, false, null)`);
})

afterEach(async () => {
    await db.query(`DELETE FROM companies`)
})

afterAll(async () => {
    await db.end()
})


describe("GET /companies", () => {
    test("Get a list with one company", async () => {
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [{ code: testCompany.code, name: testCompany.name}] })
    })
    test("Get an empty list of companies without throwing errors", async () => {
        await request(app).delete('/companies/apple');
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ companies: [] })
      })
})


describe("GET /companies/:code", () => {
    test("Get a single company without invoices", async () => {
        const company_result = await db.query(
            `INSERT INTO companies (code, name, description)
             VALUES ('google', 'Google corporation', 'Test decription') RETURNING  code, name, description`
            );
        testCompany2 = company_result.rows[0]; 
        const res = await request(app).get(`/companies/${testCompany2.code}`)
        expect(res.statusCode).toBe(200);
    })
    test("Responds with 404 for invalid company code", async () => {
        const res = await request(app).get(`/companies/ibm`)
        expect(res.statusCode).toBe(404);
    })
    test("Get a single company with an invoice", async () => {
        const res = await request(app).get(`/companies/${testCompany.code}`)
        expect(res.statusCode).toBe(200);
    })
  })


describe("POST /users", () => {
    test("Creates a single company", async () => {
        const res = await request(app).post('/companies').send({ code: 'tetra', name: 'Tetra technology', description: 'test description' });
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            company: { code: 'tetra', name: 'Tetra technology', description: 'test description' }
        })
    })
  })


describe("PUT /companies/:code", () => {
    test("Updates a single company", async () => {
        const res = await request(app).put(
            `/companies/${testCompany.code}`).send({ name: 'New Company', description: 'The same apple company description' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: { code: 'apple', name: 'New Company', description: 'The same apple company description' }
        })
    })
    test("Responds with 404 for invalid id", async () => {
        const res = await request(app).put(`/companies/ibm`).send({ name: 'New Company', description: 'The same apple company description' });
        expect(res.statusCode).toBe(404);
    })
  })

  
describe("DELETE /companies/:code", () => {
    test("Delete a single company", async () => {
        const res = await request(app).delete(`/companies/${testCompany.code}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ status: 'deleted' })
    })
    test("Respond with error 404 if a company not found", async () => {
        const res = await request(app).delete(`/companies/ibm`)
        expect(res.statusCode).toBe(404);
    })
    test("Respond with error 404 if a company code is not entered ", async () => {
        const res = await request(app).delete(`/companies/`)
        expect(res.statusCode).toBe(404);
    })
    test("Respond with error 404 if a company code is invalid ", async () => {
        const res = await request(app).delete(`/companies/test test`)
        expect(res.statusCode).toBe(404);
    })
})
