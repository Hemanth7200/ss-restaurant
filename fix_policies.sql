-- Fix: Drop existing policies then recreate
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['categories','menu_items','tables','sessions','orders','order_items','reviews','admin_users','complaints'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all on %s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "Allow all on %s" ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- Enable realtime (ignore if already enabled)
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tables;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
