import { expect } from 'chai'
import sinon from 'sinon'
import request from 'supertest';
import { getUnsignedVC, getUnsignedVCWithStatus, getValidStatusUpdateBody, getInvalidStatusUpdateBody } from './test-fixtures/fixtures.js';
import status from './status.js';
import { build } from './app.js';

const allocateEndpoint = "/credentials/status/allocate"
const updateEndpoint = "/credentials/status"
const missingCredIdErrorMessage = `Unable to find credential with given ID`
const emptyStatusManagerStub = {}

describe('api', () => {

  describe('GET /', () => {

    it('GET / => hello', async () => {
      await status.initializeStatusManager(emptyStatusManagerStub)
      const app = await build();

      const response = await request(app)
        .get("/")

      expect(response.header["content-type"]).to.have.string("json");
      expect(response.status).to.eql(200);
      expect(response.body.message).to.eql("status-service server status: ok.")

    });
  })

  describe('GET /unknown', () => {

    it('unknown endpoint returns 404', async () => {
      await status.initializeStatusManager(emptyStatusManagerStub)
      const app = await build();
      const response = await request(app)
        .get("/unknown")

      expect(response.status).to.eql(404);
    }, 10000);

  })

  describe(`POST ${allocateEndpoint}`, () => {

    it('returns 400 if no body', async () => {
      await status.initializeStatusManager(emptyStatusManagerStub)
      const app = await build();

      const response = await request(app)
        .post(allocateEndpoint)

      expect(response.header["content-type"]).to.have.string("json");
      expect(response.status).to.eql(400);
    })

    it('returns updated credential', async () => {

      const unsignedVCWithStatus = getUnsignedVCWithStatus()
      const allocateStatus = sinon.fake.returns(unsignedVCWithStatus)
      const statusManagerStub = { allocateStatus }
      await status.initializeStatusManager(statusManagerStub)
      const app = await build();

      const response = await request(app)
        .post(allocateEndpoint)
        .send(getUnsignedVC())

      expect(response.header["content-type"]).to.have.string("json");
      expect(response.status).to.eql(200);
      expect(response.body).to.eql(unsignedVCWithStatus)

    })

    it('returns unchanged credential when status already set ', async () => {
      const allocateStatus = sinon.fake.returns(getUnsignedVCWithStatus())
      const statusManagerStub = { allocateStatus }
      await status.initializeStatusManager(statusManagerStub)
      const app = await build();

      const response = await request(app)
        .post(allocateEndpoint)
        .send(getUnsignedVCWithStatus())

      expect(response.header["content-type"]).to.have.string("json");
      expect(response.status).to.eql(200);
      expect(response.body).to.eql(getUnsignedVCWithStatus())
    })
  })

  describe(`POST ${updateEndpoint}`, () => {

    it('returns 400 if no body', async () => {
      await status.initializeStatusManager(emptyStatusManagerStub)
      const app = await build();
      const response = await request(app)
        .post(updateEndpoint)

      expect(response.header["content-type"]).to.have.string("json");
      expect(response.status).to.eql(400);
    })

    it('returns update from status manager', async () => {
      const updateStatus = sinon.fake.returns({ "code": 200, "message": "Credential status successfully updated." })
      const statusManagerStub = { updateStatus }
      await status.initializeStatusManager(statusManagerStub)
      const app = await build();

      const response = await request(app)
        .post(updateEndpoint)
        .send(getValidStatusUpdateBody())

      expect(response.header["content-type"]).to.have.string("json");
      expect(response.status).to.eql(200);
      expect(response.body.message).to.eql("Credential status successfully updated.")
    })

    it('returns 404 for unknown cred id', async () => {
      // const allocateStatus = sinon.fake.returns(getUnsignedVCWithStatus())
      const updateStatus = sinon.fake.rejects(missingCredIdErrorMessage)
      const statusManagerStub = { updateStatus }
      await status.initializeStatusManager(statusManagerStub)
      const app = await build();

      const response = await request(app)
        .post(updateEndpoint)
        .send(getInvalidStatusUpdateBody())

      expect(response.header["content-type"]).to.have.string("json");
      expect(response.status).to.eql(404);
      console.log(response.body.message)
      expect(response.body.message).to.contain("An error occurred in the status-service: Credential ID not found.")
    })

  })
})


