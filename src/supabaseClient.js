import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://swlpnvuanbeyutzsvjan.supabase.co";
const supabaseKey = "sb_publishable_7bi7b7-UOUPNmCESqxwjgw_2IyWidXI";

export const supabase = createClient(supabaseUrl, supabaseKey);