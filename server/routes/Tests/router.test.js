const request = require('supertest');
const express = require('express');
const router = require('../tasks.router'); // Replace with your actual path
const pool = require('../../modules/pool');

// Mock the database pool
jest.mock('../../modules/pool', () => ({
  query: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/tasks', router);

describe('GET /tasks', () => {
  it('should fetch all non-deleted tasks', async () => {
    // Mock database response
    const mockTasks = [
      { task_id: 1, task: 'Task 1', complete: false, is_deleted: false },
      { task_id: 2, task: 'Task 2', complete: false, is_deleted: false },
    ];
    pool.query.mockResolvedValue({ rows: mockTasks });

    // Simulate the request
    const res = await request(app).get('/tasks');

    // Assertions
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockTasks);
    expect(pool.query).toHaveBeenCalledWith(
      `SELECT * FROM "tasks" WHERE "is_deleted" = false ORDER BY "task_id" ASC;`
    );
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    pool.query.mockRejectedValue(new Error('Database error'));

    const res = await request(app).get('/tasks');

    // Assertions
    expect(res.statusCode).toBe(500);
    expect(res.text).toBe('Internal Server Error');
  });
});


describe('POST /tasks', () => {
    it('should add a new task and log it to history', async () => {
        const newTask = { task_id: 1, task: 'New Task', complete: false, is_deleted: false };
    
        // Mock the INSERT query and the history log query
        pool.query
            .mockResolvedValueOnce({ rows: [newTask] }) 
            .mockResolvedValueOnce(); 
    
        const res = await request(app)
            .post('/tasks')
            .send({ task: 'New Task' });
            
        expect(res.statusCode).toBe(201);
    });
  
    it('should handle errors when inserting a task', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));
  
      const res = await request(app).post('/tasks').send({ task: 'New Task' });
  
      expect(res.statusCode).toBe(500);
    });
  });
  
