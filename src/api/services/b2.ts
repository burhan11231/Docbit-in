import B2 from "backblaze-b2";

export const uploadToB2 = async (key: string, body: Buffer, contentType: string) => {
  const bucketName = process.env.B2_BUCKET_NAME || "docbit-storage";
  
  if (process.env.B2_APPLICATION_KEY_ID) {
    const b2 = new B2({
      applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
      applicationKey: process.env.B2_APPLICATION_KEY as string
    });
    
    await b2.authorize();
    
    const { data: { buckets } } = await b2.getBucket({ bucketName: bucketName });
    const bucket = buckets[0];
    
    if (!bucket) throw new Error(`Bucket ${bucketName} not found`);

    const { data: uploadUrlData } = await b2.getUploadUrl({ bucketId: bucket.bucketId });

    await b2.uploadFile({
      uploadUrl: uploadUrlData.uploadUrl,
      uploadAuthToken: uploadUrlData.authorizationToken,
      fileName: key,
      data: body,
      mime: contentType
    });
    
    const downloadUrl = (b2 as any).downloadUrl;
    return {
      url: `${downloadUrl}/file/${bucketName}/${key}`
    };
  } else {
    console.log("[B2 Mock] File uploaded locally:", key);
    return {
      url: `https://mock.b2/${bucketName}/${key}`
    };
  }
};

