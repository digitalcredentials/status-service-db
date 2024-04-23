import testVC from './testVC.js';

const validCredentialId = 'urn:uuid:951b475e-b795-43bc-ba8f-a2d01efd2eb1';
const invalidCredentialId = 'kj09ij';
const invalidCredentialIdErrorMessage = 'An error occurred in status-service-db: ' +
  `Unable to find credential with ID ${invalidCredentialId}`;

const credentialStatus =  {
    "id": "https://digitalcredentials.github.io/credential-status-jc-test/XA5AAK1PV4#16",
    "type": "BitstringStatusListEntry",
    "statusPurpose": "revocation",
    "statusListIndex": 16,
    "statusListCredential": "https://digitalcredentials.github.io/credential-status-jc-test/XA5AAK1PV4"
};

const statusUpdateBody = {
  "credentialId": "urn:uuid:951b475e-b795-43bc-ba8f-a2d01efd2eb1",
  "credentialStatus": [{ "type": "BitstringStatusListCredential", "status": "revoked" }]
};

const getUnsignedVC = () => JSON.parse(JSON.stringify(testVC));

const getValidStatusUpdateBody = (credentialId, status) => {
  statusUpdateBody.credentialId = credentialId;
  statusUpdateBody.credentialStatus[0].status = status;
  return JSON.parse(JSON.stringify(statusUpdateBody));
};

const getInvalidStatusUpdateBody = (credentialId, status) => {
  const updateBody = getValidStatusUpdateBody(credentialId, status);
  updateBody.credentialId = credentialId;
  return updateBody;
};

const getCredentialStatus = () => JSON.parse(JSON.stringify(credentialStatus));

const getUnsignedVCWithStatus = () => {
  const unsignedVCWithStatus = getUnsignedVC();
  unsignedVCWithStatus.credentialStatus = getCredentialStatus();
  return unsignedVCWithStatus;
};

export {
  validCredentialId,
  invalidCredentialId,
  invalidCredentialIdErrorMessage,
  getUnsignedVC,
  getCredentialStatus,
  getUnsignedVCWithStatus,
  getValidStatusUpdateBody,
  getInvalidStatusUpdateBody
};
