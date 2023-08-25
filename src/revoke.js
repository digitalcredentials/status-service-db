import status from './status.js';

const revoke = async (credentialId, credentialStatus) => {
    try {
        const statusManager = await status.getStatusManager()
        const statusCredential = await statusManager.updateStatus({
            credentialId,
            credentialStatus
        });
        return { code: 200, message: "Credential status successfully updated." }
    } catch (e) {
        if (e.message.includes("Unable to find credential with given ID")) {
            return {code: 404, message: "Credential ID not found."}
        }
        return { code: 400, message: "Bad Request" }
    }

}

export default revoke