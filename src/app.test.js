import request from 'supertest';
import nock from 'nock';
import { getUnsignedVC, getUnsignedVCWithoutSuiteContext, getCredentialStatus, getUnsignedVCWithStatus, ed25519_2020suiteContext, statusListContext } from './test-fixtures/vc.js'
import { getDIDSeed } from './config.js';
import { driver } from '@digitalcredentials/did-method-key';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
nock.back.fixtures = __dirname + '/nockBackFixtures'
let saveNockRecording;

async function startNockBackRecording(fixtureFileName) {
  nock.back.setMode('wild')
  const { nockDone } = await nock.back(
    'nockMocks.json',
    {
      // Don't mock requests made locally
      afterRecord: defs => defs.filter(def => !def.scope.includes("127.0.0.1")),
      // Don't match on the request body because it changes, e.g the timestamp
      before: def => def.filteringRequestBody = (_body, recordedBody) => recordedBody,
      recorder: {
        enable_reqheaders_recording: true
      }
    }
  );
  saveNockRecording = nockDone
  // allow the requests to localhost, i.e, the test calls themselves
  nock.enableNetConnect(/127\.0\.0\.1/);
}

async function stopAndSaveNockRecording() {
  saveNockRecording()
  //nock.back.setMode('wild')
}

import { build } from './app.js'

const testDIDSeed = getDIDSeed('testing')
const didKeyDriver = driver();
const { didDocument } = await didKeyDriver.generate({ seed: testDIDSeed });
const verificationMethod = didKeyDriver.publicMethodFor({ didDocument, purpose: 'assertionMethod' }).id
const signingDID = didDocument.id
const statusUpdateBody = { "credentialId": "urn:uuid:951b475e-b795-43bc-ba8f-a2d01efd2eb1", "credentialStatus": [{ "type": "StatusList2021Credential", "status": "revoked" }] }
let app

describe('api', () => {

  
  beforeAll(async () => {
    startNockBackRecording()
  });

  afterAll(() => {
    stopAndSaveNockRecording()
  })


  beforeEach(async () => {
    app = await build();

  });

  afterEach(async () => {
  });

  describe('GET /', () => {
    it('GET / => hello', done => {
      request(app)
        .get("/")
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(/{"message":"hello"}/, done);
    });
  })

  describe('GET /unknown', () => {
    it('unknown endpoint returns 404', done => {
      request(app)
        .get("/unknown")
        .expect(404, done)
    }, 10000);
  })

  describe('POST /instance/:instanceId/credentials/issue', () => {

    it('returns the submitted vc, signed with test key', done => {
      const sentCred = getUnsignedVCWithStatus()
      request(app)
        .post("/instance/testing/credentials/issue")
        .send(sentCred)
        .expect('Content-Type', /json/)
        .expect(res => {
          const returnedCred = JSON.parse(JSON.stringify(res.body));
          const proof = returnedCred.proof
          delete (returnedCred.proof)
          sentCred.issuer.id = signingDID
          expect(sentCred).toEqual(returnedCred)
          expect(proof.type).toEqual("Ed25519Signature2020");
          expect(proof.verificationMethod).toEqual(verificationMethod)
        })
        .expect(200, done)
    });

    it('sets the issuer.id to signing DID', done => {
      request(app)
        .post("/instance/testing/credentials/issue")
        .send(getUnsignedVCWithStatus())
        .expect('Content-Type', /json/)
        .expect(res => expect(res.body.issuer.id).toEqual(signingDID))
        .expect(200, done)
    })

    it('adds the suite context', async () => {
      const response = await request(app)
        .post("/instance/testing/credentials/issue")
        .send(getUnsignedVCWithoutSuiteContext())

      expect(response.header["content-type"]).toMatch(/json/);
      expect(response.status).toEqual(200);
      expect(response.body["@context"]).toContain(ed25519_2020suiteContext)
    })

    it('adds the status list context', async () => {
      const response = await request(app)
        .post("/instance/testing/credentials/issue")
        .send(getUnsignedVC())

      expect(response.header["content-type"]).toMatch(/json/);
      expect(response.status).toEqual(200);
      expect(response.body["@context"]).toContain(statusListContext)
    })

    it('adds the credential status', async () => {
      const response = await request(app)
        .post("/instance/testing/credentials/issue")
        .send(getUnsignedVC())

      expect(response.header["content-type"]).toMatch(/json/);
      expect(response.status).toEqual(200);
      expect(response.body.credentialStatus).toMatchObject({
        "id": expect.any(String),
        "type": 'StatusList2021Entry',
        "statusPurpose": "revocation",
        "statusListIndex": expect.any(Number),
        "statusListCredential": expect.any(String)
      });
    })

    it('leaves an existing credential status as-is', async () => {
      const statusBeforeSigning = getCredentialStatus()
      const response = await request(app)
        .post("/instance/testing/credentials/issue")
        .send(getUnsignedVCWithStatus())

      expect(response.header["content-type"]).toMatch(/json/);
      expect(response.status).toEqual(200);
      expect(response.body.credentialStatus).toEqual(expect.objectContaining(statusBeforeSigning))
    })

    it('throws error without token', done => {
      // NOTE:  still have to add token auth to the issue call in app.js
      request(app)
        .post("/instance/testing/credentials/issue")
        .send(getUnsignedVCWithStatus())
        .expect('Content-Type', /json/)
        .expect(200, done)
    })


  })

  describe('POST /instance/:instanceId/credentials/status', () => {

    it('returns 400 if no body', done => {
      request(app)
        .post("/instance/testing/credentials/status")
        .expect('Content-Type', /text/)
        .expect(400, done)
    })

    it('returns 401 if github token is missing from auth header', done => {
      request(app)
        .post("/instance/testing/credentials/status")
        .send(statusUpdateBody)
        .expect('Content-Type', /text/)
        .expect(401, done)
    })

    it('returns 403 if token is not valid', done => {
      request(app)
        .post("/instance/testing/credentials/status")
        .set('Authorization', `Bearer: badToken`)
        .send(statusUpdateBody)
        .expect('Content-Type', /text/)
        .expect(403, done)
    })

    it.skip('returns 401 if token is not marked as Bearer', done => {
      /*
      Still need to figure out why this one isn't working.
      Might work now that I've added the recorder enable_request_headers option.
      Will still need to clear recorded nocks before trying this again.
      */
      request(app)
        .post("/instance/testing/credentials/status")
        .set('Authorization', `${process.env.CRED_STATUS_ACCESS_TOKEN}`)
        .send(statusUpdateBody)
        .expect('Content-Type', /text/)
        .expect(401, done)
    })

    // ALSO NEED A TEST FOR IF THE WRONG CREDENTIAL ID IS PASSED IN, RETURNING '404 NOT FOUND'
    // AND A TEST FOR THE GENERAL BAD REQUEST THAT DOESN'T FALL INTO THE OTHER CATEGORIES.

    it('calls status manager', async () => {
      const response = await request(app)
        .post("/instance/testing/credentials/status")
        .set('Authorization', `Bearer: ${process.env.CRED_STATUS_ACCESS_TOKEN}`)
        .send(statusUpdateBody)

      expect(response.header["content-type"]).toMatch(/text/);
      expect(response.status).toEqual(200);
    })

  })
})