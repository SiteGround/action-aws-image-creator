import core from "@actions/core";
import {createImage, waitUntilImageIsReady} from './aws.mjs';

(async function () {
    try {
      const wait = core.getBooleanInput('wait-for-completion');
      core.startGroup("Creating image from container")
      const amiId = await createImage();
      core.setOutput('ami-id', amiId);
      core.endGroup();
      if (wait) {
        core.startGroup("Waiting for image " + amiId + "to be ready")
        await waitUntilImageIsReady(amiId);
        core.endGroup();
      }
    } catch (error) {
      core.error(error);
      core.setFailed(error.message);
    }
  })();