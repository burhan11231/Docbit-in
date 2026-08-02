import { Router } from "express";
import { razorpay } from "../services/payment.js";
import { supabaseService } from "../services/supabase.js";

const router = Router();

router.post("/create-subscription", async (req, res) => {
  try {
    const { plan_id, customer_id } = req.body;
    
    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan_id,
      customer_notify: 1,
      total_count: 12 // e.g. yearly
    });

    res.json({ success: true, subscription });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/webhook", (req, res) => {
  // Handle Razorpay webhooks (payment.authorized, subscription.charged, etc)
  // Validate webhook signature here
  console.log("Webhook received:", req.body);
  res.json({ status: "ok" });
});

export default router;
