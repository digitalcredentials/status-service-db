import {
  createStatusManager as createStatusManagerDb
} from '@digitalcredentials/credential-status-manager-db';
import {
  createStatusManager as createStatusManagerGit
} from '@digitalcredentials/credential-status-manager-git';
import { getConfig } from './config.js';

const {
  // Database env vars
  statusCredSiteOrigin,
  credStatusDatabaseUrl,
  credStatusDatabaseHost,
  credStatusDatabasePort,
  credStatusDatabaseUsername,
  credStatusDatabasePassword,
  credStatusDatabaseName,
  statusCredTableName,
  configTableName,
  eventTableName,
  credEventTableName,

  // Git env vars
  credStatusService,
  credStatusRepoName,
  credStatusRepoId,
  credStatusMetaRepoName,
  credStatusMetaRepoId,
  credStatusOwnerAccountName,
  credStatusAccessToken,
  credStatusDidSeed
} = getConfig();

let STATUS_LIST_MANAGER;

async function createDatabaseStatusManager() {
  return createStatusManagerDb({
    statusCredentialSiteOrigin: statusCredSiteOrigin,
    databaseService: credStatusService,
    databaseUrl: credStatusDatabaseUrl,
    databaseHost: credStatusDatabaseHost,
    databasePort: credStatusDatabasePort,
    databaseUsername: credStatusDatabaseUsername,
    databasePassword: credStatusDatabasePassword,
    databaseName: credStatusDatabaseName,
    statusCredentialTableName: statusCredTableName,
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

async function createGitHubStatusManager() {
  return createStatusManagerGit({
    gitService: credStatusService,
    repoName: credStatusRepoName,
    metaRepoName: credStatusMetaRepoName,
    ownerAccountName: credStatusOwnerAccountName,
    repoAccessToken: credStatusAccessToken,
    metaRepoAccessToken: credStatusAccessToken,
    didMethod: 'key',
    didSeed: credStatusDidSeed,
    // This is the already the default value,
    // but setting here to be explicit
    signStatusCredential: true,
    // This is the already the default value,
    // but setting here to be explicit
    signUserCredential: false
  });
}

async function createGitLabStatusManager() {
  return createStatusManagerGit({
    gitService: credStatusService,
    repoName: credStatusRepoName,
    repoId: credStatusRepoId,
    metaRepoName: credStatusMetaRepoName,
    metaRepoId: credStatusMetaRepoId,
    ownerAccountName: credStatusOwnerAccountName,
    repoAccessToken: credStatusAccessToken,
    metaRepoAccessToken: credStatusAccessToken,
    didMethod: 'key',
    didSeed: credStatusDidSeed,
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
      STATUS_LIST_MANAGER = await createDatabaseStatusManager();
      break;
    case 'github':
      STATUS_LIST_MANAGER = await createGitHubStatusManager();
      break;
    case 'gitlab':
      STATUS_LIST_MANAGER = await createGitLabStatusManager();
      break;
    default:
      throw new Error('Encountered unsupported credential status service');
  }
}

async function getStatusManager() {
  await initializeStatusManager();
  return STATUS_LIST_MANAGER;
}

async function getStatusCredential(statusCredentialId) {
  const statusManager = await getStatusManager();
  return statusManager.getStatusCredential(statusCredentialId);
}

export default { initializeStatusManager, getStatusManager, getStatusCredential };
