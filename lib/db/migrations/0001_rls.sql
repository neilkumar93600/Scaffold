-- Enable RLS on all user-facing tables
-- Apply via: psql $DATABASE_URL -f lib/db/migrations/0001_rls.sql
-- Or: paste into Supabase Dashboard → SQL Editor

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own ON users
  FOR ALL USING (id = auth.uid());

-- teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_member ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_member ON team_members
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- team_invites
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_admin ON team_invites
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- stacks
ALTER TABLE stacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own ON stacks
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY team_member ON stacks
  FOR SELECT USING (
    team_id IS NOT NULL AND
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- templates
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_read ON templates
  FOR SELECT USING (is_public = true);
CREATE POLICY user_own ON templates
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY team_member ON templates
  FOR SELECT USING (
    team_id IS NOT NULL AND
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- playbooks
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_read ON playbooks
  FOR SELECT USING (is_public = true OR is_built_in = true);
CREATE POLICY user_own ON playbooks
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY team_member ON playbooks
  FOR SELECT USING (
    team_id IS NOT NULL AND
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- playbook_steps
ALTER TABLE playbook_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY via_playbook ON playbook_steps
  FOR ALL USING (
    playbook_id IN (
      SELECT id FROM playbooks
      WHERE is_built_in = true OR is_public = true OR user_id = auth.uid()
      OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    )
  );

-- playbook_runs
ALTER TABLE playbook_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own ON playbook_runs
  FOR ALL USING (user_id = auth.uid());

-- run_steps
ALTER TABLE run_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY via_run ON run_steps
  FOR ALL USING (
    run_id IN (SELECT id FROM playbook_runs WHERE user_id = auth.uid())
  );

-- decisions
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own ON decisions
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY team_member ON decisions
  FOR SELECT USING (
    team_id IS NOT NULL AND
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );
