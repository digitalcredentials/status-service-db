import { createStatusManager } from '@digitalcredentials/status-list-manager-git';
import { getConfig } from './config.js';

const {
    credStatusService,
    credStatusRepoName,
    credStatusMetaRepoName,
    credStatusRepoOrgName,
    credStatusAccessToken,
    credStatusDidSeed
} = getConfig();

let STATUS_LIST_MANAGER;

// creates or retrieves status list manager
export async function getStatusManager() {
    if (!STATUS_LIST_MANAGER) {
      STATUS_LIST_MANAGER = await createStatusManager({
          service: credStatusService,
          repoName: credStatusRepoName,
          metaRepoName: credStatusMetaRepoName,
          repoOrgName: credStatusRepoOrgName,
          repoAccessToken: credStatusAccessToken,
          metaRepoAccessToken: credStatusAccessToken,
          didMethod: 'key',
          didSeed: credStatusDidSeed,
          signUserCredential: false,
          signStatusCredential: true
      });
    }
    return STATUS_LIST_MANAGER;
}
