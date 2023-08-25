import { createStatusManager } from '@digitalcredentials/credential-status-manager-git';
import { getConfig } from './config.js';

const {
    credStatusRepoName,
    credStatusMetaRepoName,
    credStatusOwnerAccountName,
    credStatusAccessToken,
    credStatusDidSeed
} = getConfig();

let STATUS_LIST_MANAGER;

/* we allow passing in a status manager, for testing */
async function initializeStatusManager(statusManager) {
    if (statusManager) {
        STATUS_LIST_MANAGER = statusManager
    } else if (!STATUS_LIST_MANAGER) {
            STATUS_LIST_MANAGER = await createStatusManager({
                service: 'github',
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
}

function getStatusManager() {
    return STATUS_LIST_MANAGER;
}

export default { initializeStatusManager, getStatusManager }