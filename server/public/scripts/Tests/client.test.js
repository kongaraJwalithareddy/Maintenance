// client.test.js
const $ = require('jquery');
global.$ = $; // Make jQuery available globally

// Import the functions from client.js
const {
    readyOn,
    getTasks,
    submitTask,
    completeTask,
    deleteTask,
    viewTaskHistory,
    downloadTasksHistory,
} = require('../client'); // Adjust the path as necessary

// Mocking the AJAX function
$.ajax = jest.fn();

describe('Task Manager Functions', () => {
    beforeEach(() => {
        // Clear any previous calls to $.ajax
        $.ajax.mockClear();
        // Clear the HTML of the task table body before each test
        $('#task-table-body').empty();
    });

    test('readyOn initializes correctly', () => {
        readyOn();
        expect($.ajax).toHaveBeenCalledWith(expect.objectContaining({
            type: 'GET',
            url: '/tasks',
        }));
    });

    test('getTasks renders tasks correctly', () => {
        const mockTasks = [
            { id: 1, task: 'Test Task 1', status: 'Complete' },
            { id: 2, task: 'Test Task 2', status: 'Incomplete' },
        ];

        // Mock the AJAX call to return the mock tasks
        $.ajax.mockImplementation((options) => {
            if (options.url === '/tasks') {
                return Promise.resolve(mockTasks); // Return a resolved promise with mock data
            }
        });

        return getTasks().then(() => {
            // Check if the tasks are rendered correctly
            expect($('#task-table-body').html()).toContain('Test Task 1');
            expect($('#task-table-body').html()).toContain('Test Task 2');
            expect($('#task-table-body').html()).toContain('Complete');
        });
    });

    // Additional tests for other functions can be added here
});