import express from 'express';
import cors from 'cors';
import status from './status.js';
import accessLogger from './middleware/accessLogger.js';
import errorHandler from './middleware/errorHandler.js';
import errorLogger from './middleware/errorLogger.js';
import invalidPathHandler from './middleware/invalidPathHandler.js';

export async function build(opts = {}) {
  await status.initializeStatusManager();

  const app = express();

  // Add middleware to write http access logs
  app.use(accessLogger());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cors());

  app.get('/', function (req, res, next) {
    res.json({ message: 'status-service-db server status: ok.' });
  });

  // Allocate status
  app.post('/credentials/status/allocate',
    async function (req, res, next) {
      try {
        const vc = req.body;
        if (!vc || !Object.keys(vc).length) {
          next({
            message: 'A Verifiable Credential must be provided in the body.',
            code: 400
          });
        }
        const vcWithStatus = await status.allocateRevocationStatus(vc);
        return res.json(vcWithStatus);
      } catch (e) {
        // We catch the async errors and pass them to the error handler.
        if (!e.message) {
          e.message = 'Unable to allocate status position.'
        }
        // Note that if e contains a code property, the following spread of e will
        // (correctly) overwrite the 500
        next({ code: 500, ...e });
      }
    });

  // Update status
  // The body will look like:
  /*
  {
    "credentialId": "urn:uuid:951b475e-b795-43bc-ba8f-a2d01efd2eb1",
    "credentialStatus": [{ "type": "BitstringStatusListCredential", "status": "revoked" }]
  }
  */
  app.post('/credentials/status',
    async function (req, res, next) {
      try {
        const updateRequest = req.body;
        if (!updateRequest || !updateRequest.credentialId || !updateRequest.credentialStatus) {
          next({
            message: 'A status update request must be provided in the body.',
            code: 400
          });
        }
        const { credentialId, credentialStatus } = updateRequest;
        const statusId = credentialStatus[0].status;
        const statusType = credentialStatus[0].type;

        if (statusType !== 'BitstringStatusListCredential') {
          next({
            message: 'BitstringStatusListCredential is the only supported status type.',
            code: 400
          });
        }
        const updateStatusResponse = await status.updateStatus(credentialId, statusId);
        return res.status(updateStatusResponse.code).json(updateStatusResponse);
      } catch (e) {
        // We catch the async errors and pass them to the error handler.
        if (!e.message) {
          e.message = 'Error updating credential status position.'
        }
        // Note that if e contains a code property, the following spread of e will
        // (correctly) overwrite the 500
        next({ code: 500, ...e });
      }
    });

  // Get credential info
  app.get('/credentials/:credentialId', async function (req, res, next) {
    const credentialId = req.params.credentialId;
    try {
      const credentialInfo = await status.getCredentialInfo(credentialId);
      return res.status(200).json(credentialInfo);
    } catch (error) {
      next({
        message: error.message,
        code: error.code
      });
    }
  });

  // Get status credential
  app.get('/:statusCredentialId', async function (req, res, next) {
    const statusCredentialId = req.params.statusCredentialId;
    try {
      const statusCredential = await status.getStatusCredential(statusCredentialId);
      return res.status(200).json(statusCredential);
    } catch (error) {
      next({
        message: error.message,
        code: error.code
      });
    }
  });

  // Attach the error handling middleware calls, in the order that they should run
  app.use(errorLogger);
  app.use(errorHandler);
  app.use(invalidPathHandler);

  return app;
}
