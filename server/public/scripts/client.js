$(document).ready(readyOn);

function readyOn() {
  console.log("I'm so ready!");

  // Render on load
  getTasks();

  $('#view-history-btn').click(viewTaskHistory);

  // Event Listener for task submission button
  $('form').submit('#submit-task', submitTask);

  // Event Listener for task completion button
  $('#task-table-body').on('click', '.completion-submit', completeTask);

  // Event listener for delete task button
  $('#task-table-body').on('click', '.delete-button', deleteTask);

  $('#download-btn').click(downloadTasksHistory);

}

// get tasks from DB and render them to the DOM
// TODO - REFACTOR
function getTasks() {
  // clear out table data
  $('#task-table-body').empty();
  // Send GET request to /tasks
  $.ajax({
    type: 'GET',
    url: '/tasks',
  })
    // When we get our request back render to DOM
    .then(function (toDoList) {
      console.log('These are the tasks from DB', toDoList);
      // Loop through data received
      for (let task of toDoList) {
        let completeButton, trClass;

        // check if tasks are complete
        // if false give option to complete
        // if true show completed
        if (!task.complete) {
          completeButton = `
            <button class="completion-submit btn btn-outline-success" data-id="${task.task_id}">
              Complete
            </button>
          `;

          trClass = 'class="table-primary"';
        } else {
          completeButton = `<img src="./images/checkmark.png" alt="Green check mark"  />`;

          trClass = 'class="table-success"';
        }

        // append the dom
        $('#task-table-body').append(`
          <tr scope="row" ${trClass}>
            <td class="complete-status col">${completeButton}</td>
            <td class="task-out col">${task.task}</td>
            <td class="delete-cell col">
              <button class="delete-button btn btn-outline-danger" data-id="${task.task_id}">Delete</button>
            </td>
          </tr>
        `);
      }
    })
    .catch((err) => {
      console.log('Error :', err);
      alert('Something went wrong.');
    });
}



// Submit task
function submitTask(event) {
  // prevent default load on form submission
  event.preventDefault();

  console.log('in submitTask');

  // Bundle up the task to be added to DB
  let taskObject = {
    task: $('#task-in').val(),
  };

  // Have AJAX make a POST request
  $.ajax({
    type: 'POST',
    url: '/tasks',
    data: taskObject,
  })
    .then((response) => {
      $('#task-in').val('');

      getTasks();
    })
    .catch((err) => {
      console.log('error: ', err);

      alert('Something went wrong.');
    });
}

// update task as complete
function completeTask() {
  // set a value for taskId
  let taskId = $(this).data('id');

  console.log('Completed task with id: ', taskId);

  $.ajax({
    method: 'PUT',
    url: `/tasks/complete/${taskId}`,
  })
    .then((response) => {
      // render updated data
      getTasks();

      // Hide the task history table after task deletion
      $('#task-history-container').hide();
    })
    .catch((err) => {
      console.log('Completion Error: ', err);

      alert('Something went wrong..', err);
    });
}

// delete task
function deleteTask() {
  // set a value for taskId
  let taskId = $(this).data('id');

  swal({
    // title: "This can't be undone!",
    text: "Are you sure you're ready to delete this?",
    icon: 'warning',
    dangerMode: true,
    buttons: true,
  }).then((willDelete) => {
    if (willDelete) {
      swal('Deleted!', 'Your to do task has been deleted!', 'success');
      $.ajax({
        method: 'DELETE',
        url: `/tasks/${taskId}`,
      })
        .then((response) => {
          // render updated data
          getTasks();

          // Hide the task history table after task deletion
          $('#task-history-container').hide();
        })
        .catch((err) => {
          console.log('Deletion error: ', err);

          alert('Something went wrong..', err);
        });
    } else {
      swal("You're task is safe.");
    }
  });

  console.log('Deleted task with id:', taskId);
}

// Fetch and display task history
function viewTaskHistory() {

  if ($('#task-history-container').is(':visible')) {
    $('#task-history-container').hide();
    console.log('The task history container is visible.');
  }
  else{


  $.ajax({
    type: 'GET',
    url: '/tasks/task-history',
  })
    .then(function (historyData) {
      console.log('Task History from DB:', historyData);
      $('#task-history-container').show();
      $('#task-history-body').empty();

      for (let historyItem of historyData) {
        // let completeStatus = historyItem.complete ? 'Completed' : 'Not Completed';
        // let deletedStatus = historyItem.is_deleted ? 'Yes' : 'No';
        let modifiedAt = new Date(historyItem.modified_at).toLocaleString();
        let changeStatus= historyItem.modified_status ? historyItem.modified_status: "";
        
        $('#task-history-body').append(`
          <tr>
            <td>${historyItem.task_id}</td>
            <td>${historyItem.task}</td>
            <td>${changeStatus}</td>
            <td>${modifiedAt}</td>
          </tr>
        `);
      }
    })
    .catch((err) => {
      console.log('Error fetching task history:', err);
      alert('Something went wrong while fetching task history.');
    });
  }
}

// Download tasks history
function downloadTasksHistory() {
  // Trigger the download by sending a GET request to the backend
  $.ajax({
    type: 'GET',
    url: '/tasks/download-history', 
    xhrFields: {
      responseType: 'blob', //request to handle binary data, binary large object
    },
    success: function (data) {
      const url = window.URL.createObjectURL(data); //Creates a temporary URL for the Blob
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tasks_history.csv'; 
      a.click();
    },
    error: function (error) {
      console.log('Error downloading the file:', error);
      alert('Failed to download tasks history');
    },
  });
}


module.exports={
  readyOn,
  getTasks,
  submitTask,
  completeTask,
  deleteTask,
  viewTaskHistory,
  downloadTasksHistory,
}