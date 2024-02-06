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

    annotateCanvas.points = []
    annotateCanvas.updatePointCounter()

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
        this.mouseMoved = false;
        this.draggingPoint = null;
        this.coordLock = {x: null, y: null}
    }

    addEventListeners() {
        this.mouseDown = this.mouseDown.bind(this);
        this.mouseUp = this.mouseUp.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.leftClick = this.leftClick.bind(this);
        this.rightClick = this.rightClick.bind(this);

        this.canvas.addEventListener('mousedown', this.mouseDown);
        this.canvas.addEventListener('mouseup', this.mouseUp);
        this.canvas.addEventListener('mousemove', this.mouseMove);
        this.canvas.addEventListener('click', this.leftClick);
        this.canvas.addEventListener('contextmenu', this.rightClick);
    }

    mouseDown(event) {
        // Change dragging only if its from a left mouse button
        if (event.button == 0) {
            this.dragging = true;
            const x = event.offsetX;
            const y = event.offsetY;
            let pointMapping = this.findPointByLocation(x, y);
            if (pointMapping != null) {
                this.draggingPoint = pointMapping.point;
            }
        }
    }

    mouseUp(event) {
        if (event.button == 0) {
            this.dragging = false;
            this.draggingPoint = null;
            this.coordLock = {x: null, y: null}
        }
    }

    mouseMove(event) {
        if (this.dragging){
            this.mouseMoved = true
            let x = null;
            let y = null;
            if (this.draggingPoint != null) {
                if (this.coordLock.x != null) {
                    x = this.coordLock.x
                } else {
                    x = event.offsetX;
                }
                if (this.coordLock.y != null) {
                    y = this.coordLock.y
                } else {
                    y = event.offsetY;
                }
                this.draggingPoint.x = x;
                this.draggingPoint.y = y;
                this.drawPoints();
                this.drawArea(this.ctx);
                if (x <= 0 || x >= this.img.offsetWidth - 1) {
                    this.coordLock.x = x;
                }
                if (y <= 0 || y >= this.img.offsetHeight - 1) {
                    this.coordLock.y = y;
                }
            }
        }
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
        if (!this.mouseMoved){
            console.log(event)
            const x = event.offsetX;
            const y = event.offsetY;
            this.addPoint(x, y, this.pointRadius)
        } else {
            this.mouseMoved = false
        }
    }

    rightClick(event) {
        event.preventDefault();
        const x = event.offsetX;
        const y = event.offsetY;
        let pointMapping = this.findPointByLocation(x, y)
        if (pointMapping != null) {
            this.removePoint(pointMapping.index);
        }
    }

    addPoint(x, y, radius) {
        const point = new Point(x, y, radius, this.pointColor);
        if (!this.checkCollisionsForPoint(point)) {
            this.points.push(point);
            this.drawPoints();
            this.drawArea(this.ctx);
        }
        else {
            console.log("Collision with another point")
        }
    }

    removePoint(index) {
        this.points.splice(index, 1)
        this.drawPoints();
        this.drawArea(this.ctx);
    }

    clearCanvas() {
        // Clear the screen
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawPoints() {
        this.clearCanvas()
        this.points.forEach(point => this.drawPoint(point));
        this.updatePointCounter()
    }
    
    drawPoint(point) {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, point.radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = point.color;
        this.ctx.fill();
        this.ctx.closePath();
    }

    checkCollisionsForPoint(point) {
        for (const otherPoint of this.points) {
            if (otherPoint !== point && point.checkCollision(otherPoint)) {
                console.log(`Collision between ${point.color} point and ${otherPoint.color} point`);
                return true;
            }
        }
        return false;
    }

    isLocationInsidePoint(x, y, point) {
        const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
        return distance <= point.radius;
    }

    findPointByLocation(x, y) {
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            if (this.isLocationInsidePoint(x, y, point)) {
                return { index: i, point: point };
            }
        }
        return null; // No point found at the given location
    }

    drawArea(context, fillStyle='rgba(255, 255, 255, 0.5)') {
        if (this.points.length < 3) {
            // A polygon needs at least 3 points
            console.error('Not enough points to draw an area.');
            return;
        }

        context.beginPath();
        context.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 1; i < this.points.length; i++) {
            context.lineTo(this.points[i].x, this.points[i].y);
        }

        context.closePath();
        context.fillStyle = fillStyle;
        context.fill();
    }

    getDataURL() {
        // Create a temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        let fillStyle = 'rgba(255, 255, 255, 1.0)';
        this.drawArea(tempCtx, fillStyle);
        return tempCanvas.toDataURL('image/jpeg', 1.0);
    }

    updatePointCounter() {
        document.getElementById("totalPoints").innerText = this.points.length;
    }
}

class Point {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius
        this.color = color
    }

    checkCollision(otherPoint) {
        const distance = Math.sqrt((otherPoint.x - this.x) ** 2 + (otherPoint.y - this.y) ** 2);
        const sumOfRadii = this.radius + otherPoint.radius;
    
        return distance < sumOfRadii;
    }
}