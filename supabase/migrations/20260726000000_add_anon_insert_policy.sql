CREATE POLICY "Allow anon inserts" ON push_subscriptions
  FOR INSERT TO anon WITH CHECK (true);
