const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let dom;
let document;

beforeEach(() => {
  // Load the HTML file
  const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
  dom = new JSDOM(html);
  document = dom.window.document;
});

afterEach(() => {
  // Close the DOM after each test to clean up
  if (dom) {
    dom.window.close();
  }
});

test('should have the task input field and submit button', () => {
  const inputField = document.getElementById('task-in');
  const submitButton = document.getElementById('submit-task');
  
  expect(inputField).not.toBeNull();
  expect(submitButton).not.toBeNull();
});

test('should add a task to the list when submit is clicked', () => {
  const inputField = document.getElementById('task-in');
  const submitButton = document.getElementById('submit-task');
  
  // Simulate entering a task and clicking the submit button
  inputField.value = 'New Task';
  submitButton.click();

  // Check if the task was added to the list
  const taskList = document.getElementById('task-table-body');
  expect(taskList).toContainHTML('New Task');
});

test('should hide task history section by default', () => {
  const taskHistoryContainer = document.getElementById('task-history-container');
  expect(taskHistoryContainer.style.display).toBe('none');
});
