const initSqlJs = require('sql.js');
const fs = require('fs');

initSqlJs().then(SQL => {
  const db = new SQL.Database(fs.readFileSync('dev.db'));
  
  const countResult = db.exec('SELECT COUNT(*) as count FROM orders');
  console.log('\nTotal orders in database:', countResult[0].values[0][0]);
  
  const ordersResult = db.exec('SELECT id, ext_id, customer, status FROM orders LIMIT 25');
  if (ordersResult.length > 0) {
    console.log('\nAll orders:');
    ordersResult[0].values.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row[1]} | ${row[2]} | ${row[3]}`);
    });
  }
  
  db.close();
}).catch(err => {
  console.error('Error:', err);
});
