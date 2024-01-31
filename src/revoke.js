import status from './status.js';
import StatusException from './StatusException.js';

const revoke = async (credentialId, credentialStatus) => {
  try {
    const statusManager = await status.getStatusManager();
    const statusCredential = await statusManager.updateStatus({
      credentialId,
      credentialStatus
    });
    return { code: 200, message: 'Credential status successfully updated.', statusCredential }
  } catch (e) {
    if (e.message.includes('Unable to find credential with given ID')) {
      throw new StatusException(404, 'Credential ID not found.', e);
    }
    throw new StatusException(400, 'Bad Request', e);
  }
}

export default revoke;
