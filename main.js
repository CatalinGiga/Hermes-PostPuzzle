const assetMenu = document.getElementById('assetMenu');
const canvas = document.getElementById('canvas');

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

        const moveUpBtn = document.createElement('button');
        moveUpBtn.textContent = "⬆️";
        moveUpBtn.addEventListener('click', () => moveLayer(asset, 3));

        const moveDownBtn = document.createElement('button');
        moveDownBtn.textContent = "⬇️";
        moveDownBtn.addEventListener('click', () => moveLayer(asset, -3));

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
    
    if (event.ctrlKey) {
        asset.classList.toggle('selected');
    } else {
        document.querySelectorAll('.asset').forEach(el => el.classList.remove('selected'));
        asset.classList.add('selected');
    }

}

// Deselect all assets when clicking outside
canvas.addEventListener('click', () => {
    document.querySelectorAll('.asset').forEach(el => el.classList.remove('selected'));
});

function moveLayer(asset, direction) {
    let currentZ = parseInt(asset.style.zIndex, 10);
    let newZ = Math.max(1, currentZ + direction);
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
