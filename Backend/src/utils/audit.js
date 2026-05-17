import { AuditLog } from '../models/AuditLog.js';

/**
 * Fire-and-forget audit log writer. Callers never await it — we don't
 * want a logging failure to fail an admin action — but we do log to
 * console if the write itself errors so we know the audit trail is
 * incomplete.
 */
export function audit(req, action, target, detail) {
  AuditLog.create({
    actor: req.user?._id,
    action,
    target,
    detail,
    ip: req.ip,
    ua: req.get('user-agent'),
  }).catch((e) => {
    // eslint-disable-next-line no-console
    console.error('[audit] failed to write log', e.message);
  });
}
