import testVC from './testVC.js';

  // "credentialStatus":
  const credentialStatus =  {
    "id": "https://digitalcredentials.github.io/credential-status-jc-test/XA5AAK1PV4#16",
    "type": "StatusList2021Entry",
    "statusPurpose": "revocation",
    "statusListIndex": 16,
    "statusListCredential": "https://digitalcredentials.github.io/credential-status-jc-test/XA5AAK1PV4"
}

const statusUpdateBody = { "credentialId": "urn:uuid:951b475e-b795-43bc-ba8f-a2d01efd2eb1", "credentialStatus": [{ "type": "StatusList2021Credential", "status": "revoked" }] }

const getUnsignedVC = () => JSON.parse(JSON.stringify(testVC))

const getValidStatusUpdateBody = () => JSON.parse(JSON.stringify(statusUpdateBody))

const getInvalidStatusUpdateBody = () => {
  const updateBody = getValidStatusUpdateBody()
  updateBody.credentialId = 'kj09ij'
  return updateBody
}

const getCredentialStatus = () => JSON.parse(JSON.stringify(credentialStatus))

const getUnsignedVCWithStatus = () => {
  const unsignedVCWithStatus = getUnsignedVC();
  unsignedVCWithStatus.credentialStatus = getCredentialStatus();
  return unsignedVCWithStatus
}


export { getUnsignedVC, getCredentialStatus, getUnsignedVCWithStatus, getValidStatusUpdateBody, getInvalidStatusUpdateBody}
