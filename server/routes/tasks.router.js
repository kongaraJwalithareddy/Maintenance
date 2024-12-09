const express = require('express');

const router = express.Router();

const pool = require('../modules/pool');

const { parse } = require('json2csv');


// GET /tasks
// return all tasks from tasks table
router.get('/', function (req, res) {
  console.log('GET /tasks');
  // Query the database
  pool
    // Select all rows from "tasks" table
    .query(`SELECT * FROM "tasks" WHERE "is_deleted" = false ORDER BY "task_id" ASC;`)
    // Get back DB Results
    .then((dbRes) => {
      console.log(dbRes.rows);

      // send back each full row
      res.send(dbRes.rows);
    })
    // Or handle DB Error
    .catch((err) => {
      console.log(err);

      res.sendStatus(500);
    });
});

// ----------- Route to fetch task history
router.get('/task-history', (req, res) => {
  console.log("GET history")
  const queryText = `
    SELECT 
      task_id, 
      task, 
      complete, 
      is_deleted, 
      modified_at,
      modified_status
    FROM task_history
    ORDER BY modified_at DESC;
  `;
  
  pool.query(queryText)
    .then((dbRes) => {
      res.status(200).json(dbRes.rows); // Send the result as JSON
    })
    .catch((err) => {
      console.error('Error fetching task history:', err);
      res.status(500).send('Failed to fetch task history.');
    });
});


// ----------- POST /tasks
// add a task
router.post('/', function (req, res) {
 
  console.log(req.body);

  // Declare a variable to hold our SQL query string
  let queryTxt = `
    INSERT INTO "tasks"
      ("task")
    VALUES
      ($1)
      RETURNING *; --Get the newly inserted task details
  `;

  // Declare a variable to hold the string we want to send to DB
  let queryArg = req.body.task;

  // Query the DB to add task
  pool
    // use queryTxt and queryArg as message
    .query(queryTxt, [queryArg])
    .then((dbRes)=>{
      const newTask= dbRes.rows[0];
      const historyQuery = `
        INSERT INTO "task_history"
          ("task_id", "task", "complete", "is_deleted", "modified_at", "modified_status")
        VALUES
          ($1, $2, $3, $4, NOW(), 'Created');
      `;
      return pool.query(historyQuery, [newTask.task_id, newTask.task, newTask.complete, newTask.is_deleted]);
    })
    // Get back DB Results
    // Should just be an OK
    .then(() => {
      // Send an OK
      res.sendStatus(201);
    })
    // Or hand DB Error
    .catch((err) => {
      console.log(err);
      // send internal error
      res.sendStatus(500);
    });
});

// ----------- PUT /tasks/complete/:id
// Mark a task as complete
router.put('/complete/:id', function (req, res) {
  // target the id value of :id
  let taskId = req.params.id;

  console.log(`Targeting task with ID: ${taskId}`);
  // set a variable to hold the SQL string that will update the task

  let fetchQuery = `SELECT * FROM "tasks" WHERE "task_id" = $1;`;
  pool
    .query(fetchQuery, [taskId])
    .then((dbRes) => {
      const task = dbRes.rows[0];
      // Log the current state into the history table
      let historyQuery = `
        INSERT INTO "task_history"
          ("task_id", "task", "complete", "is_deleted", "modified_at", "modified_status")
        VALUES
          ($1, $2, $3, $4, NOW(), 'Completed');
      `;
      return pool.query(historyQuery, [task.task_id, task.task, !task.complete, task.is_deleted]);
    })
    .then(() => {
      let updateQuery = `
        UPDATE "tasks" 
        SET "complete" = true 
        WHERE "task_id" = $1;
      `;
      return pool.query(updateQuery, [taskId]);
    })
    .then(() => {
      res.sendStatus(200);
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
});


// ----------- DELETE /tasks/:id
// Delete a task (row) from DB
router.delete('/:id', function (req, res) {
  // target the id value of :id
  let taskId = req.params.id;

  console.log(`Delete request for id: ${taskId}`);

  // Fetch the current task state
  let fetchQuery = `SELECT * FROM "tasks" WHERE "task_id" = $1;`;
  pool
    .query(fetchQuery, [taskId])
    .then((dbRes) => {
      const task = dbRes.rows[0];
      // Log the current state into the history table
      let historyQuery = `
        INSERT INTO "task_history"
          ("task_id", "task", "complete", "is_deleted", "modified_at", "modified_status")
        VALUES
          ($1, $2, $3, $4, NOW(), 'Deleted');
      `;
      return pool.query(historyQuery, [task.task_id, task.task, task.complete, !task.is_deleted]);
    })
    .then(() => {
      // Mark the task as deleted
      let deleteQuery = `
        UPDATE "tasks"
        SET "is_deleted" = true
        WHERE "task_id" = $1;
      `;
      return pool.query(deleteQuery, [taskId]);
    })
    .then(() => {
      console.log(`Task marked as deleted with id: ${taskId}`);
      res.sendStatus(200);
    })
    .catch((err) => {
      console.log(`Error making database query`, err);
      res.sendStatus(500);
    });
});
  

router.get('/download-history', (req, res) => {
  console.log("GET download-history");

  // Query to fetch task history
  const queryText = `
    SELECT 
      task_id, 
      task, 
      complete, 
      is_deleted, 
      modified_at,
      modified_status
    FROM task_history
    ORDER BY modified_at DESC;
  `;

  pool.query(queryText)
    .then((dbRes) => {
      const taskHistory = dbRes.rows;

      // Convert the task history to CSV format
      const csv = parse(taskHistory);

      // Set the response headers to trigger a download
      res.header('Content-Type', 'text/csv');
      res.attachment('task_history.csv'); // Set filename
      res.send(csv); // Send CSV data to client
    })
    .catch((err) => {
      console.error('Error fetching task history:', err);
      res.status(500).send('Failed to fetch task history.');
    });
});

module.exports = router;
