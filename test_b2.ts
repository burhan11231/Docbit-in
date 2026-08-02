import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
const s3Client = new S3Client({
  endpoint: "https://" + (process.env.B2_ENDPOINT || "s3.us-west-004.backblazeb2.com"),
  region: "us-west-004", 
  credentials: {
    accessKeyId: process.env.B2_APPLICATION_KEY_ID || "mock",
    secretAccessKey: process.env.B2_APPLICATION_KEY || "mock"
  }
});
async function run() {
  try {
    await s3Client.send(new ListBucketsCommand({}));
    console.log("Success");
  } catch (err: any) {
    console.error("Error:", err.message, err.stack);
  }
}
run();
