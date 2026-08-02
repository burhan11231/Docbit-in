import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "mock-key-id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mock-key-secret",
});
