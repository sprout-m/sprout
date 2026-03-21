BEGIN;

TRUNCATE TABLE approvals, proof_submissions, milestones, investments, projects, users RESTART IDENTITY CASCADE;

INSERT INTO users (email, handle, role, hedera_account_id, password_hash) VALUES
  ('funder@sprout.test', 'alice', 'funder', '0.0.8284001', crypt('Test1234!', gen_salt('bf'))),
  ('funder2@sprout.test', 'dylan', 'funder', '0.0.8284002', crypt('Test1234!', gen_salt('bf'))),
  ('organizer@sprout.test', 'bob', 'organizer', '0.0.8285001', crypt('Test1234!', gen_salt('bf'))),
  ('organizer2@sprout.test', 'maya', 'organizer', '0.0.8285002', crypt('Test1234!', gen_salt('bf'))),
  ('admin@sprout.test', 'admin', 'admin', NULL, crypt('Test1234!', gen_salt('bf')));

WITH bob AS (
  SELECT id FROM users WHERE email = 'organizer@sprout.test'
), maya AS (
  SELECT id FROM users WHERE email = 'organizer2@sprout.test'
)
INSERT INTO projects (organizer_id, name, description, category, goal, total_amount, amount_funded, amount_released, status, hcs_topic_id, hedera_escrow_account)
SELECT bob.id, 'Ocean Plastic Recovery', 'Scale shoreline waste recovery with local fishing cooperatives and verified recycling drop-offs.', 'Sustainability', 'Remove 20 tons of plastic from coastal communities', 1200.00, 850.00, 300.00, 'active', '0.0.8315001', '0.0.8316001' FROM bob
UNION ALL
SELECT bob.id, 'Mangrove Restoration Network', 'Fund nursery operations, planting crews, and survival-rate tracking across three estuaries.', 'Climate', 'Restore 5,000 mangrove seedlings with 85% survival', 2500.00, 2500.00, 1500.00, 'active', '0.0.8315002', '0.0.8316002' FROM bob
UNION ALL
SELECT maya.id, 'Solar Clinic Backup Power', 'Install resilient solar backup systems for rural health clinics facing regular outages.', 'Energy Access', 'Keep 4 clinics powered during peak outage windows', 4000.00, 1400.00, 0.00, 'active', '0.0.8315003', '0.0.8316003' FROM maya;

WITH project_ids AS (
  SELECT id, name FROM projects
)
INSERT INTO milestones (project_id, title, description, amount, order_index, status)
SELECT id, 'Deploy recovery bins', 'Install branded collection points and onboard local operators.', 300.00, 1, 'approved' FROM project_ids WHERE name = 'Ocean Plastic Recovery'
UNION ALL
SELECT id, 'Launch pickup logistics', 'Run weekly pickup routes and reconcile drop-off manifests.', 300.00, 2, 'submitted' FROM project_ids WHERE name = 'Ocean Plastic Recovery'
UNION ALL
SELECT id, 'Publish impact report', 'Release audited tonnage report with recycler receipts.', 600.00, 3, 'pending' FROM project_ids WHERE name = 'Ocean Plastic Recovery'
UNION ALL
SELECT id, 'Nursery setup', 'Build seedling nursery and train community team leads.', 800.00, 1, 'approved' FROM project_ids WHERE name = 'Mangrove Restoration Network'
UNION ALL
SELECT id, 'Estuary planting sprint', 'Coordinate first large-scale planting week across all sites.', 700.00, 2, 'approved' FROM project_ids WHERE name = 'Mangrove Restoration Network'
UNION ALL
SELECT id, 'Six-month survival audit', 'Verify survival rates and replant weak sections.', 1000.00, 3, 'pending' FROM project_ids WHERE name = 'Mangrove Restoration Network'
UNION ALL
SELECT id, 'Site survey and permits', 'Complete electrical survey, local permits, and vendor selection.', 900.00, 1, 'pending' FROM project_ids WHERE name = 'Solar Clinic Backup Power'
UNION ALL
SELECT id, 'Equipment procurement', 'Purchase panels, batteries, inverters, and monitoring hardware.', 1600.00, 2, 'pending' FROM project_ids WHERE name = 'Solar Clinic Backup Power'
UNION ALL
SELECT id, 'Installation and commissioning', 'Install systems, certify output, and train clinic staff.', 1500.00, 3, 'pending' FROM project_ids WHERE name = 'Solar Clinic Backup Power';

WITH alice AS (
  SELECT id FROM users WHERE email = 'funder@sprout.test'
), dylan AS (
  SELECT id FROM users WHERE email = 'funder2@sprout.test'
), project_ids AS (
  SELECT id, name FROM projects
)
INSERT INTO investments (project_id, funder_id, amount, hedera_tx_id)
SELECT p.id, alice.id, 500.00, '0.0.8284001-1700000001' FROM alice, project_ids p WHERE p.name = 'Ocean Plastic Recovery'
UNION ALL
SELECT p.id, dylan.id, 350.00, '0.0.8284002-1700000002' FROM dylan, project_ids p WHERE p.name = 'Ocean Plastic Recovery'
UNION ALL
SELECT p.id, alice.id, 1500.00, '0.0.8284001-1700000003' FROM alice, project_ids p WHERE p.name = 'Mangrove Restoration Network'
UNION ALL
SELECT p.id, dylan.id, 1000.00, '0.0.8284002-1700000004' FROM dylan, project_ids p WHERE p.name = 'Mangrove Restoration Network'
UNION ALL
SELECT p.id, alice.id, 800.00, '0.0.8284001-1700000005' FROM alice, project_ids p WHERE p.name = 'Solar Clinic Backup Power'
UNION ALL
SELECT p.id, dylan.id, 600.00, '0.0.8284002-1700000006' FROM dylan, project_ids p WHERE p.name = 'Solar Clinic Backup Power';

WITH bob AS (
  SELECT id FROM users WHERE email = 'organizer@sprout.test'
), milestone_ids AS (
  SELECT m.id, m.title, p.name AS project_name
  FROM milestones m JOIN projects p ON p.id = m.project_id
)
INSERT INTO proof_submissions (milestone_id, organizer_id, text_update, image_urls, doc_urls, file_hashes)
SELECT m.id, bob.id, 'Collection bins deployed across three fishing harbors with signed operator handoff sheets.', ARRAY['https://images.example/ocean-bin-1.jpg'], ARRAY['https://docs.example/ocean-bin-report.pdf'], ARRAY['hash-ocean-bin-1']
FROM milestone_ids m, bob WHERE m.project_name = 'Ocean Plastic Recovery' AND m.title = 'Deploy recovery bins'
UNION ALL
SELECT m.id, bob.id, 'Pickup routes are live and reconciliation is underway for the first month of collection.', ARRAY['https://images.example/ocean-route-1.jpg'], ARRAY['https://docs.example/ocean-logistics.pdf'], ARRAY['hash-ocean-route-1']
FROM milestone_ids m, bob WHERE m.project_name = 'Ocean Plastic Recovery' AND m.title = 'Launch pickup logistics'
UNION ALL
SELECT m.id, bob.id, 'Nursery site is operational and first seedling batches are tracked in the field register.', ARRAY['https://images.example/mangrove-nursery.jpg'], ARRAY['https://docs.example/mangrove-nursery.pdf'], ARRAY['hash-mangrove-1']
FROM milestone_ids m, bob WHERE m.project_name = 'Mangrove Restoration Network' AND m.title = 'Nursery setup'
UNION ALL
SELECT m.id, bob.id, 'Planting sprint completed across all estuary zones with attendance and survival baselines logged.', ARRAY['https://images.example/mangrove-planting.jpg'], ARRAY['https://docs.example/mangrove-sprint.pdf'], ARRAY['hash-mangrove-2']
FROM milestone_ids m, bob WHERE m.project_name = 'Mangrove Restoration Network' AND m.title = 'Estuary planting sprint';

WITH alice AS (
  SELECT id FROM users WHERE email = 'funder@sprout.test'
), milestone_ids AS (
  SELECT m.id, m.title, p.name AS project_name
  FROM milestones m JOIN projects p ON p.id = m.project_id
)
INSERT INTO approvals (milestone_id, verifier_id, decision, note, approval_payload, kms_key_id, kms_signature, hedera_tx_id)
SELECT m.id, alice.id, 'approved', 'Deployment evidence verified against harbor photos and operator checklist.', 'payload-ocean-1', 'arn:aws:kms:us-east-2:010438461646:key/683547bb-92fd-4912-9414-4130c2c7e919', 'sig-ocean-1', 'release-ocean-1'
FROM milestone_ids m, alice WHERE m.project_name = 'Ocean Plastic Recovery' AND m.title = 'Deploy recovery bins'
UNION ALL
SELECT m.id, alice.id, 'approved', 'Nursery setup matched procurement records and field team confirmation.', 'payload-mangrove-1', 'arn:aws:kms:us-east-2:010438461646:key/683547bb-92fd-4912-9414-4130c2c7e919', 'sig-mangrove-1', 'release-mangrove-1'
FROM milestone_ids m, alice WHERE m.project_name = 'Mangrove Restoration Network' AND m.title = 'Nursery setup'
UNION ALL
SELECT m.id, alice.id, 'approved', 'Planting sprint verified with geotagged evidence and survival baseline logs.', 'payload-mangrove-2', 'arn:aws:kms:us-east-2:010438461646:key/683547bb-92fd-4912-9414-4130c2c7e919', 'sig-mangrove-2', 'release-mangrove-2'
FROM milestone_ids m, alice WHERE m.project_name = 'Mangrove Restoration Network' AND m.title = 'Estuary planting sprint';

COMMIT;
