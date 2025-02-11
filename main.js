const assetMenu = document.getElementById('assetMenu');
const canvas = document.getElementById('canvas');
const fullscreenButton = document.getElementById('fullscreenButton');

// Function to toggle fullscreen
async function toggleFullscreen() {
    if (!document.fullscreenElement) {
        try {
            await document.documentElement.requestFullscreen();
        } catch (e) {
            console.error('Error attempting to enable fullscreen:', e);
        }
    } else {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        }
    }
}

// Function to update background based on fullscreen state
function updateBackground() {
    if (document.fullscreenElement) {
        document.body.classList.add('fullscreen');
        console.log('Fullscreen mode enabled');
    } else {
        document.body.classList.remove('fullscreen');
        console.log('Fullscreen mode disabled');
    }
}

// Event listeners
fullscreenButton.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateBackground);
document.addEventListener('webkitfullscreenchange', updateBackground);
document.addEventListener('mozfullscreenchange', updateBackground);
document.addEventListener('MSFullscreenChange', updateBackground);

// Initial check
updateBackground();

assetMenu.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG' || e.target.dataset.url) {
        e.dataTransfer.setData('text/plain', e.target.closest('div').getAttribute('data-url'));
    }
});

canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
});

canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const assetUrl = e.dataTransfer.getData('text/plain');
    if (assetUrl) {
        createAsset(assetUrl, e.offsetX, e.offsetY);
    }
});

let zIndexCounter = 1;

// Add these variables at the top with other state variables
let isRotating = false;
let rotatingAsset = null;
let initialAngle = 0;
let centerX, centerY;

function createAsset(url, x, y) {
    const asset = document.createElement('div');
    asset.classList.add('asset');
    asset.style.backgroundImage = `url('${url}')`;
    
    // Set initial z-index by counting existing assets
    const assets = Array.from(document.querySelectorAll('.asset'));
    asset.style.zIndex = assets.length + 1;

    const img = new Image();
    img.src = url;
    img.onload = function() {
        const aspectRatio = img.width / img.height;
        const initialWidth = 100;
        asset.style.width = `${initialWidth}px`;
        asset.style.height = `${initialWidth / aspectRatio}px`;
        
        // Remove the constraints from initial positioning
        asset.style.left = `${x - initialWidth / 2}px`;
        asset.style.top = `${y - (initialWidth / aspectRatio) / 2}px`;

        const resizeHandle = document.createElement('div');
        resizeHandle.classList.add('resize-handle');
        asset.appendChild(resizeHandle);

        const layerControls = document.createElement('div');
        layerControls.classList.add('layer-controls');
        layerControls.style.display = "none"; // Hide by default

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = "❌";
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            asset.remove();
        });

        const moveUpBtn = document.createElement('button');
        moveUpBtn.textContent = "⬆️";
        moveUpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            moveLayer(asset, 1);
        });

        const moveDownBtn = document.createElement('button');
        moveDownBtn.textContent = "⬇️";
        moveDownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            moveLayer(asset, -1);
        });

        layerControls.appendChild(deleteBtn);
        layerControls.appendChild(moveUpBtn);
        layerControls.appendChild(moveDownBtn);
        asset.appendChild(layerControls);

        asset.addEventListener('mousedown', startDrag);
        asset.addEventListener('click', (e) => selectAsset(asset, e));
        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            startResize(e, asset, aspectRatio);
        });

        // Add rotation handle
        const rotateHandle = document.createElement('div');
        rotateHandle.classList.add('rotate-handle');
        asset.appendChild(rotateHandle);

        // Add rotation event listener
        rotateHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            startRotation(e, asset);
        });
    };
    canvas.appendChild(asset);
}

function selectAsset(asset, event) {
    event.stopPropagation();

    // Deselect all assets first
    document.querySelectorAll('.asset').forEach(el => {
        el.classList.remove('selected');
        const controls = el.querySelector('.layer-controls');
        const resizeHandle = el.querySelector('.resize-handle');
        const rotateHandle = el.querySelector('.rotate-handle');
        
        if (controls) controls.style.display = "none";
        if (resizeHandle) resizeHandle.style.display = "none";
        if (rotateHandle) rotateHandle.style.display = "none";
    });

    // Select the clicked asset
    asset.classList.add('selected');
    const controls = asset.querySelector('.layer-controls');
    const rotateHandle = asset.querySelector('.rotate-handle');
    const resizeHandle = asset.querySelector('.resize-handle');
    
    if (controls) controls.style.display = "flex";
    if (rotateHandle) rotateHandle.style.display = "block";
    if (resizeHandle) resizeHandle.style.display = "block";
}

// Deselect all assets when clicking outside
canvas.addEventListener('click', (e) => {
    if (e.target === canvas) {
        document.querySelectorAll('.asset').forEach(el => {
            el.classList.remove('selected');
            const controls = el.querySelector('.layer-controls');
            const resizeHandle = el.querySelector('.resize-handle');
            const rotateHandle = el.querySelector('.rotate-handle');
            
            if (controls) controls.style.display = "none";
            if (resizeHandle) resizeHandle.style.display = "none";
            if (rotateHandle) rotateHandle.style.display = "none";
        });
    }
});

function moveLayer(asset, direction) {
    const assets = Array.from(document.querySelectorAll('.asset'));
    
    // Normalize z-indices
    assets.sort((a, b) => parseInt(a.style.zIndex || 0) - parseInt(b.style.zIndex || 0));
    assets.forEach((a, index) => {
        a.style.zIndex = index + 1; // Ensure no gaps in z-index
    });

    const currentZ = parseInt(asset.style.zIndex);
    
    if (direction > 0 && currentZ < assets.length) {
        // Moving up
        const swapAsset = assets.find(a => parseInt(a.style.zIndex) === currentZ + 1);
        if (swapAsset) {
            swapAsset.style.zIndex = currentZ;
            asset.style.zIndex = currentZ + 1;
        }
    } else if (direction < 0 && currentZ > 1) {
        // Moving down
        const swapAsset = assets.find(a => parseInt(a.style.zIndex) === currentZ - 1);
        if (swapAsset) {
            swapAsset.style.zIndex = currentZ;
            asset.style.zIndex = currentZ - 1;
        }
    }

    // Keep the asset selected and controls visible after moving
    selectAsset(asset, { stopPropagation: () => {} });
}

let activeAsset = null;
let isDragging = false;
let isResizing = false;
let offsetX, offsetY, resizingAsset;

function startDrag(e) {
    isDragging = true;
    activeAsset = this;
    offsetX = e.clientX - activeAsset.offsetLeft;
    offsetY = e.clientY - activeAsset.offsetTop;

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
}

function drag(e) {
    if (!isDragging || !activeAsset) return;
    activeAsset.style.left = `${e.clientX - offsetX}px`;
    activeAsset.style.top = `${e.clientY - offsetY}px`;
}

function endDrag() {
    isDragging = false;
    activeAsset = null;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', endDrag);
}

function startResize(e, asset, aspectRatio) {
    isResizing = true;
    resizingAsset = asset;
    const initialWidth = asset.clientWidth;
    const initialX = e.clientX;

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', endResize);

    function resize(e) {
        if (!isResizing || !resizingAsset) return;
        const newWidth = Math.max(20, initialWidth + (e.clientX - initialX));
        const newHeight = newWidth / aspectRatio;

        resizingAsset.style.width = `${newWidth}px`;
        resizingAsset.style.height = `${newHeight}px`;
    }

    function endResize() {
        isResizing = false;
        resizingAsset = null;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', endResize);
    }
}

const saveButton = document.getElementById('saveButton');

saveButton.addEventListener('click', async () => {
    try {
        // Hide controls
        document.querySelectorAll('.asset').forEach(el => {
            el.classList.remove('selected');
            const controls = el.querySelector('.layer-controls');
            const resizeHandle = el.querySelector('.resize-handle');
            const rotateHandle = el.querySelector('.rotate-handle');
            
            if (controls) controls.style.display = "none";
            if (resizeHandle) resizeHandle.style.display = "none";
            if (rotateHandle) rotateHandle.style.display = "none";
        });

        // Get the canvas element
        const canvasElement = document.getElementById('canvas');
        
        // Create a temporary canvas
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        
        // Set dimensions (1080x1080 for Instagram)
        tempCanvas.width = 1080;
        tempCanvas.height = 1080;
        
        // Set white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Get all assets and sort by z-index (lowest to highest)
        const assets = Array.from(canvasElement.querySelectorAll('.asset'));
        assets.sort((a, b) => {
            const zA = parseInt(a.style.zIndex) || 0;
            const zB = parseInt(b.style.zIndex) || 0;
            return zA - zB; // Draw from bottom to top
        });

        // Draw each asset
        for (const asset of assets) {
            await new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                
                const bgImage = asset.style.backgroundImage;
                const url = bgImage.slice(4, -1).replace(/['"]/g, '');
                
                img.onload = () => {
                    // Calculate scale factor
                    const scale = 1080 / canvasElement.offsetWidth;

                    // Get position and size
                    const left = parseFloat(asset.style.left) * scale;
                    const top = parseFloat(asset.style.top) * scale;
                    const width = asset.offsetWidth * scale;
                    const height = asset.offsetHeight * scale;

                    // Get rotation
                    const rotation = getCurrentRotation(asset);

                    // Apply transformations
                    ctx.save();
                    ctx.translate(left + width / 2, top + height / 2);
                    ctx.rotate(rotation * Math.PI / 180);
                    ctx.drawImage(img, -width / 2, -height / 2, width, height);
                    ctx.restore();

                    resolve();
                };
                
                img.src = url;
            });
        }

        // Save the image
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'instagram-post.png';
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            
            // Restore controls
            document.querySelectorAll('.asset').forEach(el => {
                const controls = el.querySelector('.layer-controls');
                const resizeHandle = el.querySelector('.resize-handle');
                const rotateHandle = el.querySelector('.rotate-handle');
                
                if (resizeHandle) resizeHandle.style.removeProperty('display');
                if (rotateHandle) rotateHandle.style.removeProperty('display');
                if (controls && el.classList.contains('selected')) {
                    controls.style.removeProperty('display');
                }
            });
        }, 'image/png', 1.0);

    } catch (error) {
        console.error('Error saving image:', error);
        alert('There was an error saving your image. Please try again.');
    }
});

// Add these new functions for rotation
function startRotation(e, asset) {
    e.stopPropagation(); // Prevent other events from interfering
    isRotating = true;
    rotatingAsset = asset;
    
    // Get the center point of the asset
    const rect = asset.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    
    // Calculate initial angle
    initialAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    
    // Get current rotation
    const currentRotation = getCurrentRotation(asset);
    
    // Define rotate function in closure to maintain reference
    function rotate(e) {
        if (!isRotating || !rotatingAsset) return;
        
        // Calculate new angle
        const newAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const angleDiff = (newAngle - initialAngle) * (180 / Math.PI);
        
        // Update rotation
        rotatingAsset.style.transform = `rotate(${currentRotation + angleDiff}deg)`;
    }
    
    // Define endRotation function in closure
    function endRotation() {
        if (!isRotating) return;
        
        isRotating = false;
        
        // Only show handles if the asset is selected
        if (rotatingAsset) {
            const rotateHandle = rotatingAsset.querySelector('.rotate-handle');
            const resizeHandle = rotatingAsset.querySelector('.resize-handle');
            if (rotateHandle && rotatingAsset.classList.contains('selected')) {
                rotateHandle.style.display = "block";
            }
            if (resizeHandle && rotatingAsset.classList.contains('selected')) {
                resizeHandle.style.display = "block";
            }
        }
        
        rotatingAsset = null;
        document.removeEventListener('mousemove', rotate);
        document.removeEventListener('mouseup', endRotation);
    }
    
    // Add event listeners
    document.addEventListener('mousemove', rotate);
    document.addEventListener('mouseup', endRotation);
}

// Update getCurrentRotation to handle invalid transforms
function getCurrentRotation(element) {
    try {
        const style = window.getComputedStyle(element);
        const transform = style.transform;
        
        // Handle case where there is no transform
        if (transform === 'none' || !transform) {
            return 0;
        }
        
        const matrix = new WebKitCSSMatrix(transform);
        const angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
        return angle;
    } catch (error) {
        console.error('Error getting rotation:', error);
        return 0;
    }
}
