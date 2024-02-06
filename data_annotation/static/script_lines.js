let image_paths = []
let image_index = 0
let directoryPath = null

//track mouse position on mousemove
let mousePosition;
//track state of mousedown and up
let isMouseDown;

let annotateCanvas = null

window.addEventListener('load', function () {
    updateImageCounter("", -1, 0)
    let imgElement = document.getElementById('originalImage')
    let canvasElement = document.getElementById('imageCanvas')    
    annotateCanvas = new AnnotateCanvas(imgElement, canvasElement)
});

function getFileNameFromPath(path) {
    console.log(path)
    return path.split('/').pop();
}

function updateImageCounter(imageName, imageIndex, imageTotal) {
    let imageNumber = imageIndex + 1
    document.getElementById('imageName').innerText = imageName;
    document.getElementById('imageIndex').innerText = imageNumber;
    document.getElementById('totalImages').innerText = imageTotal;
}

function updateAnnotationExistence(annotationExists) {
    let status = "Does not exists";
    if (annotationExists) {
        status = "Exists";
    }
    document.getElementById('annotationExistence').innerText = status
}

function loadImages() {
    inputDir = document.getElementById('inputDir').value;
    directoryPath = inputDir;
    const originalImage = document.getElementById('originalImage');

    // Clear previous images
    originalImage.innerHTML = '';

    // Reset image index
    image_index = 0

    // Fetch images from the server
    fetch(`/get_images?input_dir=${encodeURIComponent(inputDir)}`)
        .then(response => response.json())
        .then(data => {
            image_paths = data;
            
            first_image_path = image_paths[0];
            // Extract the file name from the path
            const fileName = getFileNameFromPath(first_image_path)
            updateImageCounter(fileName, image_index, image_paths.length);
            loadImage(first_image_path);
        })
        .catch(error => console.error('Error fetching images:', error));
}

function nextImage() {
    image_index += 1
    if (image_index >= image_paths.length) {
        image_index = 0
    }
    img_path = image_paths[image_index]
    loadImage(img_path)
    const fileName = getFileNameFromPath(img_path);
    updateImageCounter(fileName, image_index, image_paths.length)
}

function previousImage() {
    image_index -= 1
    if (image_index < 0) {
        image_index = image_paths.length - 1
    }
    img_path = image_paths[image_index]
    loadImage(img_path)
    const fileName = getFileNameFromPath(img_path);
    updateImageCounter(fileName, image_index, image_paths.length)
}

function loadImage(img_path) {
    const imgElement = document.getElementById('originalImage');
    imgElement.setAttribute("src", img_path)

    // Fetch images from the server
    fetch(`/image_has_annotation?input_img_path=${encodeURIComponent(img_path)}`)
    .then(response => response.json())
    .then(data => {
        console.log(data)
        let annotationExistence = data["annotationExistence"]
        updateAnnotationExistence(annotationExistence)
    })
    .catch(error => console.error('Error checking annotation existence:', error));

    // Lay the canvas on top of the img element
    imgElement.onload = function() {
        annotateCanvas.positionCanvas()
        annotateCanvas.clearCanvas()
    }
}

function saveImage() {
    if (annotateCanvas == null) {
        console.error("Failed to save annotation because there is no canvas")
    }

    const dataURL = annotateCanvas.getDataURL()
    // Create a new Image element
    const img = new Image();

    // Set the src attribute to the canvas data URL
    img.src = dataURL;

    targetWidth = annotateCanvas.img.naturalWidth;
    targetHeight = annotateCanvas.img.naturalHeight;

    // Wait for the image to load
    img.onload = function () {
        // Create a new canvas with the target dimensions
        const newCanvas = document.createElement('canvas');
        newCanvas.width = targetWidth;
        newCanvas.height = targetHeight;
        const newCtx = newCanvas.getContext('2d');

        // Draw the loaded image onto the new canvas with the target dimensions
        newCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Get the data URL of the scaled image
        const scaledDataURL = newCanvas.toDataURL('image/jpeg', 1.0);

        // Create a FormData object and append the dataURL as a file
        const formData = new FormData();
        formData.append('image', scaledDataURL);
        formData.append('output_dir', directoryPath);
        formData.append('file_name', getFileNameFromPath(image_paths[image_index]))
    
        // Send a POST request to Flask
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
    }

}


class AnnotateCanvas {
    constructor(imgElement, canvasElement) {
        this.img = imgElement;
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext("2d");
        this.addEventListeners()
        this.pointRadius = 5;
        this.pointColor = "#FF0000";
        this.points = [];
        this.dragging = false;
        this.mouseX = null;
        this.mouseY = null
    }

    addEventListeners() {
        this.mouseDown = this.mouseDown.bind(this);
        this.mouseUp = this.mouseUp.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.mouseLeave = this.mouseLeave.bind(this);
        this.leftClick = this.leftClick.bind(this);
        this.rightClick = this.rightClick.bind(this);

        this.canvas.addEventListener('mousedown', this.mouseDown);
        this.canvas.addEventListener('mouseup', this.mouseUp);
        this.canvas.addEventListener('mousemove', this.mouseMove);
        this.canvas.addEventListener('mouseleave', this.mouseLeave);
        this.canvas.addEventListener('click', this.leftClick);
        this.canvas.addEventListener('contextmenu', this.rightClick);
    }

    mouseDown(event) {
        // Change dragging only if its from a left mouse button
        if (event.button == 0) {
            this.dragging = true;
            this.mouseX = event.offsetX;
            this.mouseY = event.offsetY;
        }
    }

    mouseUp(event) {
        if (event.button === 0 && this.dragging) {
            const x = event.offsetX;
            const y = event.offsetY;

            if (event.ctrlKey) {
                // If CTRL key is held, draw a line between the starting point and the mouse release point
                this.draw(this.mouseX, this.mouseY, x, y);
            }

            this.dragging = false;
        }
    }

    mouseLeave(event) {
        if (this.dragging) {
            this.dragging = false;
        }
    }

    mouseMove(event) {
        if (this.dragging){
            const x = event.offsetX;
            const y = event.offsetY;

            if (event.ctrlKey) {

            } else {
                // If CTRL key is not held, draw freely
                this.draw(this.mouseX, this.mouseY, x, y);
                this.mouseX = x;
                this.mouseY = y;
            }
        }
    }

    draw(x1, y1, x2, y2, color='rgba(255, 0, 0, 0.2)', width=5) {
        this.ctx.beginPath()
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = color;
        this.lineJoin = "round";
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    positionCanvas() {
        this.canvas.style.left = this.img.offsetLeft.toString() + "px";
        this.canvas.style.top = this.img.offsetTop.toString() + "px";
        this.canvas.width = this.img.width;
        this.canvas.height = this.img.height;
        this.canvas.style.width = this.img.width.toString() + "px";
        this.canvas.style.height = this.img.height.toString() + "px";
    }


    leftClick(event) {

    }

    rightClick(event) {
        event.preventDefault();
    }

    clearCanvas() {
        // Clear the screen
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    getDataURL() {
        // Create a temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        let imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        let data = imgData.data
        for (let i = 0; i < data.length; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];
            const alpha = data[i + 3];

            if ((red || green || blue) && alpha) {
                data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 255
            }
        }
        tempCtx.putImageData(imgData, 0, 0);
        return tempCanvas.toDataURL('image/jpeg', 1.0);
    }
}