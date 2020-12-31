const db = require('../../db.js');

const shoppingRefresh = (req, res, next) => {
  console.log('in shoppingRefresh');
  // remove items from shopping where (list_qty <= 0)

  // add items to shopping (list_qty = par - qty, pantry_id = pantry._id)
  let qStr = `DELETE FROM shopping WHERE user_id = '1' AND list_qty <= 0 RETURNING *;`;
  return db
    .query(qStr)
    .then((qres) => {
      console.log(
        'file: shoppingRefresh.js ~ line 11 ~ .then ~ qres.rows',
        qres.rows,
      );
      // find items in pantry that are low on stock where (par > qty)
      qStr = `SELECT * FROM pantry WHERE user_id = '1' AND par > qty;`;
      return db.query(qStr);
    })
    .then((qres) => {
      const importList = qres.rows;
      console.log(
        'file: shoppingRefresh.js ~ line 16 ~ .then ~ importList',
        importList,
      );
      console.log(importList.length > 0);
      importList.forEach((newItem) => {
        console.log(
          'file: shoppingRefresh.js ~ line 25 ~ importList.map ~ newItem',
          newItem,
        );
        // find out if item from pantry is already in shopping

        qStr = `SELECT * FROM shopping WHERE pantry_id = ${newItem._id};`;
        db.query(qStr)
          .then((qres) => {
            return qres.rows[0] ? qres.rows[0] : false;
          })
          .then((pantryItem) => {
            console.log(
              'Currently working Line 39 in refresh on: \n',
              pantryItem,
            );
            // if cooresponding shopping item does not exist, create one.
            if (!pantryItem) {
              qStr = `INSERT INTO shopping (user_id, pantry_id, item_name, note, unit, list_qty, buy_qty, category) 
                VALUES ('1','${newItem._id}', '${newItem.item_name}', '${
                newItem.note
              }', '${newItem.unit}', 
                '${newItem.par - newItem.qty}', 0, '${newItem.category}');`;
              return db.query(qStr);
            } else {
              // if so, update list_qty to be max(list_qty, par-qty)
              const qStr = `UPDATE shopping 
                SET list_qty = ${Math.max(
                  pantryItem.list_qty,
                  newItem.par - newItem.qty,
                )} 
                WHERE pantry_id = ${newItem._id};`;
              return db.query(qStr);
            }
          });
      });
    })
    .then(() => {
      return next();
    })
    .catch(() => {
      return next({
        log: 'shoppingController.shoppingRefresh error',
        message: { err: 'SQL query failed' },
      });
    });
};

module.exports = shoppingRefresh;
