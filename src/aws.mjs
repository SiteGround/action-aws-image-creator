import { EC2 } from "@aws-sdk/client-ec2";
import core from "@actions/core";

async function createImage(retryWithSuffix = false) {
    const instanceId = core.getInput('instance-id');
    const newAmiName = core.getInput('name') + (retryWithSuffix ? '_' + Date.now() : '');
    const newAmiDescription = core.getInput('description');
    const client = new EC2({apiVersion: '2016-11-15'});
    const params = {
      InstanceId: instanceId,
      Name: newAmiName,
      Description: newAmiDescription
    };

  try {
    const data = await client.createImage(params);
    core.setOutput('name', params.Name);
    core.info("Image " + data.ImageId + " creation started");
    return data.ImageId;
  } catch (error) {
    if (error.Code === 'InvalidAMIName.Duplicate' && !retryWithSuffix) {
      return await createImage(true);
    }
    core.error('AWS EC2 AMI creation error');
    throw error;
  }
}

async function waitUntilImageIsReady(imageId = false) {
  try {
    const client = new EC2({apiVersion: '2016-11-15'});
    const timeout = Date.now() + 30*60*1000;
    while(Date.now() < timeout) {
      const data = await client.describeImages({Filters: [{Name:"image-id", Values:[imageId]}]});
      if (data.Images === undefined || data.Images.length === 0) {
        throw "Image " + imageId + " not found!";
      }
      if (data.Images[0].State === 'available') {
        core.info("Image " + imageId + " ready for use!");
        return true;
      }
      await sleep(2*60000);  
    }
    core.warning("Timed out waiting for image " + imageId + " to become ready!");
    return false;
  } catch (error) {
    core.error('AWS EC2 waiting for image creation failed');
    throw error;
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export {
  waitUntilImageIsReady,
  createImage
};