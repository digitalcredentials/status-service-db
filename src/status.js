import {
  createStatusManager as createStatusManagerGit
} from '@digitalcredentials/credential-status-manager-git';
import {
  createStatusManager as createStatusManagerDb
} from '@digitalcredentials/credential-status-manager-db';
import { getConfig } from './config.js';

const {
  // Git env vars
  credStatusService,
  credStatusRepoName,
  credStatusRepoId,
  credStatusMetaRepoName,
  credStatusMetaRepoId,
  credStatusOwnerAccountName,
  credStatusAccessToken,
  credStatusDidSeed,

  // Database env vars
  statusCredentialSiteOrigin,
  credStatusDatabaseUrl,
  credStatusDatabaseHost,
  credStatusDatabasePort,
  credStatusDatabaseUsername,
  credStatusDatabasePassword
} = getConfig();

let STATUS_LIST_MANAGER;

async function createGitHubStatusManager() {
  return createStatusManagerGit({
    service: credStatusService,
    repoName: credStatusRepoName,
    metaRepoName: credStatusMetaRepoName,
    ownerAccountName: credStatusOwnerAccountName,
    repoAccessToken: credStatusAccessToken,
    metaRepoAccessToken: credStatusAccessToken,
    didMethod: 'key',
    didSeed: credStatusDidSeed,
    signUserCredential: false,
    signStatusCredential: true
  });
}

async function createGitLabStatusManager() {
  return createStatusManagerGit({
    service: credStatusService,
    repoName: credStatusRepoName,
    repoId: credStatusRepoId,
    metaRepoName: credStatusMetaRepoName,
    metaRepoId: credStatusMetaRepoId,
    ownerAccountName: credStatusOwnerAccountName,
    repoAccessToken: credStatusAccessToken,
    metaRepoAccessToken: credStatusAccessToken,
    didMethod: 'key',
    didSeed: credStatusDidSeed,
    signUserCredential: false,
    signStatusCredential: true
  });
}

async function createMongoDbStatusManager() {
  return createStatusManagerDb({
    statusCredentialSiteOrigin,
    databaseService: credStatusService,
    databaseUrl: credStatusDatabaseUrl,
    databaseHost: credStatusDatabaseHost,
    databasePort: credStatusDatabasePort,
    databaseUsername: credStatusDatabaseUsername,
    databasePassword: credStatusDatabasePassword,
    didMethod: 'key',
    didSeed: credStatusDidSeed,
    signUserCredential: false,
    signStatusCredential: true
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
    case 'github':
      STATUS_LIST_MANAGER = await createGitHubStatusManager();
      break;
    case 'gitlab':
      STATUS_LIST_MANAGER = await createGitLabStatusManager();
      break;
    case 'mongodb':
      STATUS_LIST_MANAGER = await createMongoDbStatusManager();
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
  if (credStatusService !== 'mongodb') {
    return null;
  }
  const statusManager = await getStatusManager();
  return statusManager.getStatusCredential(statusCredentialId);
}

export default { initializeStatusManager, getStatusManager, getStatusCredential };