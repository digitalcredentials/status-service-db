import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import {
  validCredentialId,
  invalidCredentialId,
  invalidCredentialIdErrorMessage,
  getUnsignedVC,
  getUnsignedVCWithStatus,
  getValidStatusUpdateBody,
  getInvalidStatusUpdateBody
} from './test-fixtures/fixtures.js';
import status from './status.js';
import { build } from './app.js';

const allocateEndpoint = '/credentials/status/allocate';
const updateEndpoint = '/credentials/status';
const emptyStatusManagerStub = {};

describe('api', () => {
  describe('GET /', () => {
    it('GET / => hello', async () => {
      await status.initializeStatusManager(emptyStatusManagerStub);
      const app = await build();

      const response = await request(app)
        .get('/');

      expect(response.header['content-type']).to.have.string('json');
      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal('status-service-db server status: ok.');
    });
  });

  describe('GET /unknown/path', () => {
    it('unknown endpoint returns 404', async () => {
      await status.initializeStatusManager(emptyStatusManagerStub);
      const app = await build();

      const response = await request(app)
        .get('/unknown/path');

      expect(response.status).to.equal(404);
    }, 10000);
  });

  describe(`POST ${allocateEndpoint}`, () => {
    it('returns 400 if no body', async () => {
      await status.initializeStatusManager(emptyStatusManagerStub);
      const app = await build();

      const response = await request(app)
        .post(allocateEndpoint);

      expect(response.header['content-type']).to.have.string('json');
      expect(response.status).to.equal(400);
    });

    it('returns updated credential', async () => {
      const unsignedVCWithStatus = getUnsignedVCWithStatus();
      const allocateSupportedStatuses = sinon.fake.returns(unsignedVCWithStatus);
      const statusManagerStub = { allocateSupportedStatuses };
      await status.initializeStatusManager(statusManagerStub);
      const app = await build();

      const response = await request(app)
        .post(allocateEndpoint)
        .send(getUnsignedVC());

      expect(response.header['content-type']).to.have.string('json');
      expect(response.status).to.equal(200);
      expect(response.body).to.eql(unsignedVCWithStatus);
    });

    it('returns unchanged credential when status already set ', async () => {
      const allocateStatus = sinon.fake.returns(getUnsignedVCWithStatus());
      const statusManagerStub = { allocateStatus };
      await status.initializeStatusManager(statusManagerStub);
      const app = await build();

      const response = await request(app)
        .post(allocateEndpoint)
        .send(getUnsignedVCWithStatus());

      expect(response.header['content-type']).to.have.string('json');
      expect(response.status).to.equal(200);
      expect(response.body).to.eql(getUnsignedVCWithStatus());
    });
  });

  describe(`POST ${updateEndpoint}`, () => {
    it('returns 400 if no body', async () => {
      await status.initializeStatusManager(emptyStatusManagerStub);
      const app = await build();

      const response = await request(app)
        .post(updateEndpoint);

      expect(response.header['content-type']).to.have.string('json');
      expect(response.status).to.equal(400);
    });

    it('returns update from revoked credential', async () => {
      const revokeCredential = sinon.fake.returns({
        code: 200,
        message: 'Credential successfully revoked.'
      });
      const statusManagerStub = { revokeCredential };
      await status.initializeStatusManager(statusManagerStub);
      const app = await build();

      const response = await request(app)
        .post(updateEndpoint)
        .send(getValidStatusUpdateBody(validCredentialId, 'revoked'));

      expect(response.header['content-type']).to.have.string('json');
      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal('Credential successfully revoked.');
    });

    it('returns update from suspended credential', async () => {
      const suspendCredential = sinon.fake.returns({
        code: 200,
        message: 'Credential successfully suspended.'
      });
      const statusManagerStub = { suspendCredential };
      await status.initializeStatusManager(statusManagerStub);
      const app = await build();

      const response = await request(app)
        .post(updateEndpoint)
        .send(getValidStatusUpdateBody(validCredentialId, 'suspended'));

      expect(response.header['content-type']).to.have.string('json');
      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal('Credential successfully suspended.');
    });

    it('returns update from unsuspended credential', async () => {
      const unsuspendCredential = sinon.fake.returns({
        code: 200,
        message: 'Credential successfully unsuspended.'
      });
      const statusManagerStub = { unsuspendCredential };
      await status.initializeStatusManager(statusManagerStub);
      const app = await build();

      const response = await request(app)
        .post(updateEndpoint)
        .send(getValidStatusUpdateBody(validCredentialId, 'unsuspended'));

      expect(response.header['content-type']).to.have.string('json');
      expect(response.status).to.equal(200);
      expect(response.body.message).to.equal('Credential successfully unsuspended.');
    });

    it('returns 404 for unknown credential id', async () => {
      const missingCredentialError = new Error(invalidCredentialIdErrorMessage);
      missingCredentialError.code = 404;
      const revokeCredential = sinon.fake.rejects(missingCredentialError);
      const statusManagerStub = { revokeCredential };
      await status.initializeStatusManager(statusManagerStub);
      const app = await build();

      const response = await request(app)
        .post(updateEndpoint)
        .send(getInvalidStatusUpdateBody(invalidCredentialId, 'revoked'));

      expect(response.header['content-type']).to.have.string('json');
      expect(response.status).to.equal(404);
      expect(response.body.message).to.contain('Unable to find credential with ID');
    });
  });
});
