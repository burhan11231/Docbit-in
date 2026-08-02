import B2 from 'backblaze-b2';
const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID || 'mock',
  applicationKey: process.env.B2_APPLICATION_KEY || 'mock'
});
async function run() {
  await b2.authorize();
  console.log("Authorized.");
  const bucketName = process.env.B2_BUCKET_NAME || 'docbit-storage';
  const res = await b2.getBucket({ bucketName });
  console.log("Bucket:", res.data.buckets[0].bucketId);
  console.log("Download URL:", (b2 as any).downloadUrl);
}
run();
