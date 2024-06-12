import { createStatusManager } from '@digitalcredentials/credential-status-manager-db';
import { getConfig } from './config.js';

const {
  credStatusService,
  statusCredSiteOrigin,
  credStatusDatabaseUrl,
  credStatusDatabaseHost,
  credStatusDatabasePort,
  credStatusDatabaseUsername,
  credStatusDatabasePassword,
  credStatusDatabaseName,
  statusCredTableName,
  userCredTableName,
  configTableName,
  eventTableName,
  credEventTableName,
  credStatusDidSeed
} = getConfig();

let STATUS_LIST_MANAGER;

async function createMongoDbStatusManager() {
  return createStatusManager({
    statusCredentialSiteOrigin: statusCredSiteOrigin,
    databaseService: credStatusService,
    databaseUrl: credStatusDatabaseUrl,
    databaseHost: credStatusDatabaseHost,
    databasePort: credStatusDatabasePort,
    databaseUsername: credStatusDatabaseUsername,
    databasePassword: credStatusDatabasePassword,
    databaseName: credStatusDatabaseName,
    statusCredentialTableName: statusCredTableName,
    userCredentialTableName: userCredTableName,
    configTableName,
    eventTableName,
    credentialEventTableName: credEventTableName,
    didMethod: 'key',
    didSeed: credStatusDidSeed,
    // This is the already the default value,
    // but setting here to be explicit
    autoDeployDatabase: true,
    // This is the already the default value,
    // but setting here to be explicit
    signStatusCredential: true,
    // This is the already the default value,
    // but setting here to be explicit
    signUserCredential: false
  });
}

/* we allow passing in a status manager, for testing */
async function initializeStatusManager(statusManager) {
  if (statusManager) {
    STATUS_LIST_MANAGER = statusManager;
    return;
  } else if (STATUS_LIST_MANAGER) {
    return;
  }

  switch (credStatusService) {
    case 'mongodb':
      STATUS_LIST_MANAGER = await createMongoDbStatusManager();
      break;
    default:
      throw new Error(`Encountered unsupported credential status service: ${credStatusService}`);
  }
}

async function getStatusManager() {
  await initializeStatusManager();
  return STATUS_LIST_MANAGER;
}

async function allocateRevocationStatus(verifiableCredential) {
  const statusManager = await getStatusManager();
  const result = verifiableCredential.credentialStatus ?
    verifiableCredential :
    await statusManager.allocateRevocationStatus(verifiableCredential);
  return result;
}

async function updateStatus(credentialId, credentialStatus) {
  const statusManager = await getStatusManager();
  try {
    switch (credentialStatus) {
      case 'revoked':
        await statusManager.revokeCredential(credentialId);
        return { code: 200, message: 'Credential successfully revoked.' };
      case 'suspended':
        await statusManager.suspendCredential(credentialId);
        return { code: 200, message: 'Credential successfully suspended.' };
      case 'unsuspended':
        await statusManager.unsuspendCredential(credentialId);
        return { code: 200, message: 'Credential successfully unsuspended.' };
      default:
        return { code: 400, message: `Unsupported credential status: "${credentialStatus}"` };
    }
  } catch (error) {
    return {
      code: error.code ?? 500,
      message: error.message ??
        `Unable to apply status "${credentialStatus}" to credential with ID "${credentialId}".`
    };
  }
}

async function getCredentialInfo(credentialId) {
  const statusManager = await getStatusManager();
  return statusManager.getCredentialInfo(credentialId);
}

async function getStatusCredential(statusCredentialId) {
  const statusManager = await getStatusManager();
  return await statusManager.getStatusCredential(statusCredentialId);
}

export default {
  initializeStatusManager,
  getStatusManager,
  allocateRevocationStatus,
  updateStatus,
  getCredentialInfo,
  getStatusCredential
};
