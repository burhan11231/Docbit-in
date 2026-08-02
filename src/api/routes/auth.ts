import { Router } from "express";
import { supabaseService } from "../services/supabase.js";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const SUPABASE_URL = process.env.SUPABASE_URL || "https://mock.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "mock-key";

// Registration
router.post("/register", async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    // Use an anon client for auth so we don't mutate the global service client
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    
    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: { data: { full_name } }
    });
    
    if (error) throw error;
    
    if (data.user) {
      await supabaseService.from('profiles').insert({
        id: data.user.id,
        full_name: full_name
      });
    }

    res.json({ success: true, user: data.user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    
    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Ensure profile exists
    if (data.user) {
      const { data: profile } = await supabaseService.from('profiles').select('id').eq('id', data.user.id).single();
      if (!profile) {
        await supabaseService.from('profiles').insert({
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || email.split('@')[0]
        });
      }
    }

    res.json({ success: true, session: data.session });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    // Can't really sign out the specific user globally via API like this without token
    // But local storage clear is enough for the client.
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
