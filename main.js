const canvas = document.getElementById('canvas');
const draggables = document.querySelectorAll('.draggable');
const resetButton = document.getElementById('resetButton');
const showPostButton = document.getElementById('showPostButton');
const canvasContainer = document.getElementById('canvasContainer');
const assetsContainer = document.getElementById('assetsContainer');
const descriptionContainer = document.querySelector('.description-container');

draggables.forEach(draggable => {
  draggable.addEventListener('dragstart', dragStart);
  draggable.addEventListener('dragend', dragEnd);
});

canvas.addEventListener('dragover', dragOver);
canvas.addEventListener('drop', drop);

let draggedItem = null;

function dragStart(e) {
  draggedItem = e.target;
  setTimeout(() => {
    e.target.style.display = 'none';
  }, 0);
}

function dragEnd(e) {
  setTimeout(() => {
    draggedItem.style.display = 'block';
    draggedItem = null;
  }, 0);
}

function dragOver(e) {
  e.preventDefault();
}

function drop(e) {
  e.preventDefault();
  canvas.appendChild(draggedItem);
  draggedItem.style.position = 'absolute';
  draggedItem.style.left = `${e.clientX - canvas.offsetLeft - draggedItem.width / 2}px`;
  draggedItem.style.top = `${e.clientY - canvas.offsetTop - draggedItem.height / 2}px`;
}

// Reset Button Functionality
resetButton.addEventListener('click', function() {
  canvas.innerHTML = ''; // Clear the canvas
  draggables.forEach(draggable => {
    document.querySelector('.assets-container').appendChild(draggable);
    draggable.style.position = 'static'; // Reset position
  });
});

// Show Final Post Button Functionality
showPostButton.addEventListener('click', function() {
  canvasContainer.classList.toggle('hidden'); // Hide canvas container
  assetsContainer.classList.toggle('hidden'); // Hide assets container
  descriptionContainer.classList.toggle('hidden'); // Hide description container
  showPostButton.textContent = canvasContainer.classList.contains('hidden') ? 'Edit Post' : 'Show Final Post';
});
