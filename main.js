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

function createAsset(url, x, y) {
    const asset = document.createElement('div');
    asset.classList.add('asset');
    asset.style.backgroundImage = `url('${url}')`;
    asset.style.zIndex = zIndexCounter++;

    const img = new Image();
    img.src = url;
    img.onload = function() {
        const aspectRatio = img.width / img.height;
        const initialWidth = 100;
        asset.style.width = `${initialWidth}px`;
        asset.style.height = `${initialWidth / aspectRatio}px`;
        asset.style.left = `${Math.min(x - initialWidth / 2, canvas.clientWidth - initialWidth)}px`;
        asset.style.top = `${Math.min(y - (initialWidth / aspectRatio) / 2, canvas.clientHeight - (initialWidth / aspectRatio))}px`;

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
            layerControls.style.display = "flex";
            asset.classList.add('selected');
        });

        const moveDownBtn = document.createElement('button');
        moveDownBtn.textContent = "⬇️";
        moveDownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            moveLayer(asset, -1);
            layerControls.style.display = "flex";
            asset.classList.add('selected');
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
    };
    canvas.appendChild(asset);
}

function selectAsset(asset, event) {
    event.stopPropagation();

    // Deselect all assets first
    document.querySelectorAll('.asset').forEach(el => {
        el.classList.remove('selected');
        el.querySelector('.layer-controls').style.display = "none";
    });

    // Select the clicked asset
    asset.classList.add('selected');
    const layerControls = asset.querySelector('.layer-controls');
    layerControls.style.display = "flex";
}

// Deselect all assets when clicking outside
canvas.addEventListener('click', () => {
    document.querySelectorAll('.asset').forEach(el => {
        el.classList.remove('selected');
        el.querySelector('.layer-controls').style.display = "none"; // Hide layer controls
    });
});

function moveLayer(asset, direction) {
    const assets = Array.from(document.querySelectorAll('.asset'));
    const currentZ = parseInt(asset.style.zIndex, 10);
    
    // Find all current z-indices
    const zIndices = assets.map(a => parseInt(a.style.zIndex, 10) || 0);
    
    let newZ;
    if (direction > 0) {
        // Moving up - place above highest layer
        newZ = Math.max(...zIndices) + 1;
    } else {
        // Moving down - ensure we don't go below 1
        const minZ = Math.min(...zIndices);
        if (minZ <= 1) {
            // If we're already at the bottom, shift all other elements up
            assets.forEach(a => {
                if (a !== asset) {
                    a.style.zIndex = parseInt(a.style.zIndex, 10) + 1;
                }
            });
            newZ = 1;
        } else {
            newZ = minZ - 1;
        }
    }
    
    asset.style.zIndex = newZ;
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
    activeAsset.style.left = `${Math.min(Math.max(e.clientX - offsetX, 0), canvas.clientWidth - activeAsset.clientWidth)}px`;
    activeAsset.style.top = `${Math.min(Math.max(e.clientY - offsetY, 0), canvas.clientHeight - activeAsset.clientHeight)}px`;
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
        // Remove any selected state and controls before capturing
        document.querySelectorAll('.asset').forEach(el => {
            el.classList.remove('selected');
            el.querySelector('.layer-controls').style.display = "none";
            el.querySelector('.resize-handle').style.display = "none";
        });

        // Get the canvas element
        const canvasElement = document.getElementById('canvas');
        
        // Create a temporary canvas with higher resolution
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        
        // Set dimensions to Instagram's preferred size (1080x1080)
        tempCanvas.width = 1080;
        tempCanvas.height = 1080;
        
        // Set white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Get all assets and draw them to the canvas
        const assets = Array.from(canvasElement.querySelectorAll('.asset'));
        
        // Sort assets by z-index
        assets.sort((a, b) => {
            return (parseInt(a.style.zIndex) || 0) - (parseInt(b.style.zIndex) || 0);
        });

        // Load and draw each asset
        await Promise.all(assets.map(async (asset) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                
                // Get the background image URL
                const bgImage = asset.style.backgroundImage;
                const url = bgImage.slice(4, -1).replace(/['"]/g, '');
                
                img.onload = () => {
                    // Calculate scaled positions and dimensions
                    const scale = 1080 / 600; // ratio between desired size and current canvas size
                    const left = parseFloat(asset.style.left) * scale;
                    const top = parseFloat(asset.style.top) * scale;
                    const width = asset.offsetWidth * scale;
                    const height = asset.offsetHeight * scale;
                    
                    ctx.drawImage(img, left, top, width, height);
                    resolve();
                };
                
                img.src = url;
            });
        }));

        // Convert to blob and download
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'instagram-post.png';
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            
            // Restore controls visibility
            document.querySelectorAll('.asset').forEach(el => {
                el.querySelector('.resize-handle').style.removeProperty('display');
                el.querySelector('.layer-controls').style.removeProperty('display');
            });
        }, 'image/png', 1.0);

    } catch (error) {
        console.error('Error saving image:', error);
        alert('There was an error saving your image. Please try again.');
    }
});
