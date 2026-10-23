const Database = require('better-sqlite3');
const db = new Database('delivery.db');

console.log('Resetting demo orders for human approval testing...');
const del = db.prepare("DELETE FROM tickets WHERE order_id IN ('DEMO-1001', 'DEMO-1002')").run();
console.log('Deleted tickets:', del.changes);

const upd = db.prepare("UPDATE ticket_proposals SET status = 'PENDING_APPROVAL', ticket_id = NULL, approved_at = NULL WHERE order_id IN ('DEMO-1001', 'DEMO-1002')").run();
console.log('Updated proposals to PENDING_APPROVAL:', upd.changes);

console.log('Current pending proposals:');
console.log(db.prepare("SELECT proposal_id, order_id, scenario, status FROM ticket_proposals WHERE status = 'PENDING_APPROVAL'").all());
