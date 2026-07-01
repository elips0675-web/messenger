import { Router } from 'express';
const router = Router();
import pool from '../db.js';
import { auth, asyncHandler } from '../middleware.js';

// List workflow templates
router.get('/', auth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT w.*, (SELECT COUNT(*) FROM workflow_stages WHERE workflow_id = w.id) stages_count
     FROM workflows w ORDER BY w.created_at DESC`
  );
  res.json(rows);
}));

// Create workflow template
router.post('/', auth, asyncHandler(async (req, res) => {
  const { name, description, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const [r] = await pool.query(
    `INSERT INTO workflows (name, description, icon, created_by) VALUES (?,?,?,?)`,
    [name, description || '', icon || '📋', req.user.id]
  );
  const [rows] = await pool.query(`SELECT * FROM workflows WHERE id = ?`, [r.insertId]);
  res.status(201).json(rows[0]);
}));

// Submit a request
router.post('/requests', auth, asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { workflow_id, title, description } = req.body;
    if (!workflow_id || !title) return res.status(400).json({ error: 'workflow_id and title required' });

    // Get stages
    const [stages] = await conn.query(
      `SELECT * FROM workflow_stages WHERE workflow_id = ? ORDER BY step_order`, [workflow_id]
    );
    if (!stages.length) return res.status(400).json({ error: 'No stages in this workflow' });

    // Create request
    const [r] = await conn.query(
      `INSERT INTO workflow_requests (workflow_id, title, description, requester_id, current_stage)
       VALUES (?,?,?,?,?)`,
      [workflow_id, title, description || '', req.user.id, stages[0].id]
    );

    // Create approval records for all stages
    for (const s of stages) {
      await conn.query(
        `INSERT INTO workflow_approvals (request_id, stage_id, approver_id) VALUES (?,?,?)`,
        [r.insertId, s.id, s.approver_id]
      );
    }

    await conn.commit();
    const [rows] = await pool.query(`SELECT * FROM workflow_requests WHERE id = ?`, [r.insertId]);
    res.status(201).json(rows[0]);
  } finally {
    conn.release();
  }
}));

// List requests (my requests + pending my approval)
router.get('/requests', auth, asyncHandler(async (req, res) => {
  const [requests] = await pool.query(
    `SELECT wr.*, w.name workflow_name, w.icon workflow_icon,
            u.name requester_name,
            (SELECT COUNT(*) FROM workflow_approvals WHERE request_id = wr.id AND status='pending') pending_count
     FROM workflow_requests wr
     JOIN workflows w ON w.id = wr.workflow_id
     LEFT JOIN users u ON u.id = wr.requester_id
     WHERE wr.requester_id = ? OR wr.id IN (
       SELECT request_id FROM workflow_approvals WHERE approver_id = ?
     )
     ORDER BY wr.created_at DESC`,
    [req.user.id, req.user.id]
  );
  res.json(requests);
}));

// Get request detail with approvals
router.get('/requests/:id', auth, asyncHandler(async (req, res) => {
  const [reqs] = await pool.query(
    `SELECT wr.*, w.name workflow_name, w.icon workflow_icon, u.name requester_name
     FROM workflow_requests wr
     JOIN workflows w ON w.id = wr.workflow_id
     LEFT JOIN users u ON u.id = wr.requester_id
     WHERE wr.id = ?`, [req.params.id]
  );
  if (!reqs.length) return res.status(404).json({ error: 'Not found' });

  const [approvals] = await pool.query(
    `SELECT wa.*, s.name stage_name, s.step_order,
            u.name approver_name, u.title approver_title
     FROM workflow_approvals wa
     JOIN workflow_stages s ON s.id = wa.stage_id
     LEFT JOIN users u ON u.id = wa.approver_id
     WHERE wa.request_id = ? ORDER BY s.step_order`, [req.params.id]
  );
  reqs[0].approvals = approvals;
  res.json(reqs[0]);
}));

// Approve or reject
router.post('/requests/:id/approve', auth, asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { action, comment } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Action must be approved or rejected' });
    }

    const [reqs] = await conn.query(`SELECT * FROM workflow_requests WHERE id = ?`, [req.params.id]);
    if (!reqs.length) return res.status(404).json({ error: 'Not found' });

    const reqData = reqs[0];
    if (reqData.status !== 'pending') return res.status(400).json({ error: 'Already ' + reqData.status });

    // Find pending approval for this user
    const [pending] = await conn.query(
      `SELECT * FROM workflow_approvals
       WHERE request_id = ? AND approver_id = ? AND status = 'pending'
       ORDER BY id LIMIT 1`, [req.params.id, req.user.id]
    );
    if (!pending.length) return res.status(403).json({ error: 'No pending approval for you' });

    const stageId = pending[0].stage_id;
    const newStatus = action === 'approved' ? 'approved' : 'rejected';

    await conn.query(
      `UPDATE workflow_approvals SET status = ?, comment = ?, decided_at = NOW() WHERE id = ?`,
      [newStatus, comment || null, pending[0].id]
    );

    if (action === 'rejected') {
      // Rejected — whole request is rejected
      await conn.query(`UPDATE workflow_requests SET status = 'rejected' WHERE id = ?`, [req.params.id]);
    } else {
      // Approved — check if this was the last pending stage
      const [remaining] = await conn.query(
        `SELECT COUNT(*) cnt FROM workflow_approvals
         WHERE request_id = ? AND status = 'pending'`, [req.params.id]
      );
      if (remaining[0].cnt === 0) {
        await conn.query(`UPDATE workflow_requests SET status = 'approved', current_stage = NULL WHERE id = ?`,
          [req.params.id]);
      } else {
        // Move to next stage
        const [nextStage] = await conn.query(
          `SELECT id FROM workflow_stages WHERE workflow_id = ? AND step_order > (
            SELECT step_order FROM workflow_stages WHERE id = ?
          ) ORDER BY step_order LIMIT 1`,
          [reqData.workflow_id, stageId]
        );
        if (nextStage.length) {
          await conn.query(`UPDATE workflow_requests SET current_stage = ? WHERE id = ?`,
            [nextStage[0].id, req.params.id]);
        }
      }
    }

    await conn.commit();
    const [updated] = await pool.query(`SELECT * FROM workflow_requests WHERE id = ?`, [req.params.id]);
    res.json(updated[0]);
  } finally {
    conn.release();
  }
}));

// Get template with stages
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const [w] = await pool.query(`SELECT * FROM workflows WHERE id = ?`, [req.params.id]);
  if (!w.length) return res.status(404).json({ error: 'Not found' });
  const [stages] = await pool.query(
    `SELECT s.*, u.name approver_name, u.title approver_title
     FROM workflow_stages s LEFT JOIN users u ON u.id = s.approver_id
     WHERE s.workflow_id = ? ORDER BY s.step_order`, [req.params.id]
  );
  w[0].stages = stages;
  res.json(w[0]);
}));

// Update template
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const { name, description, icon } = req.body;
  await pool.query(
    `UPDATE workflows SET name=COALESCE(?,name), description=COALESCE(?,description), icon=COALESCE(?,icon) WHERE id=?`,
    [name, description, icon, req.params.id]
  );
  const [rows] = await pool.query(`SELECT * FROM workflows WHERE id = ?`, [req.params.id]);
  res.json(rows[0]);
}));

// Delete template
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  await pool.query(`DELETE FROM workflows WHERE id = ?`, [req.params.id]);
  res.json({ ok: true });
}));

// Add stage to template
router.post('/:id/stages', auth, asyncHandler(async (req, res) => {
  const { name, approver_id } = req.body;
  if (!name || !approver_id) return res.status(400).json({ error: 'Name and approver_id required' });
  const [max] = await pool.query(
    `SELECT COALESCE(MAX(step_order),-1)+1 next FROM workflow_stages WHERE workflow_id=?`, [req.params.id]
  );
  const [r] = await pool.query(
    `INSERT INTO workflow_stages (workflow_id, name, step_order, approver_id) VALUES (?,?,?,?)`,
    [req.params.id, name, max[0].next, approver_id]
  );
  const [rows] = await pool.query(
    `SELECT s.*, u.name approver_name, u.title approver_title
     FROM workflow_stages s LEFT JOIN users u ON u.id = s.approver_id WHERE s.id = ?`, [r.insertId]
  );
  res.status(201).json(rows[0]);
}));

// Remove stage
router.delete('/:workflowId/stages/:id', auth, asyncHandler(async (req, res) => {
  await pool.query(`DELETE FROM workflow_stages WHERE id = ? AND workflow_id = ?`,
    [req.params.id, req.params.workflowId]);
  res.json({ ok: true });
}));

export default router;
