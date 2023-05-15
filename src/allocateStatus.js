import { getStatusManager } from './getStatusManager.js';
const statusManager = await getStatusManager()

export default allocateStatus = async (verifiableCredential) => {
    return verifiableCredential.credentialStatus ? 
        verifiableCredential :
        await statusManager.allocateStatus(verifiableCredential)
}

