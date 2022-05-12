import core from "@actions/core";
import {createImage, waitUntilImageIsReady, clearOtherImages} from './aws.mjs';

(async function () {
    try {
      const wait = core.getBooleanInput('wait-for-completion');
      const deregister = core.getBooleanInput('deregister-old-images');
      core.startGroup("Creating image from container")
      const amiId = await createImage();
      core.setOutput('ami-id', amiId);
      core.endGroup();
      if (wait) {
        core.startGroup("Waiting for image " + amiId + "to be ready");
        await waitUntilImageIsReady(amiId);
        core.endGroup();
        if (deregister) {
          const imagePrefix = core.getInput('name');
          core.startGroup("Clear other images with " + imagePrefix + "* name");
          await clearOtherImages(imagePrefix, amiId);
          core.endGroup();
        }
      }
    } catch (error) {
      core.error(error);
      core.setFailed(error.message);
    }
  })();