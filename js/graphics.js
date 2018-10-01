// IEFE
(function(){
    class Toolbox{
        static get LINE_TOOL() {return 101};
        static get PENCIL_TOOL() {return 102};
        constructor(id){
            this.element = document.getElementById(id);
            if(this.element === null){
                console.error("Cannot Instantiate Toolbox : No toolbox found with id " + id);
                return;
            }
            // Get Elements
            this.bgColorElement = document.getElementById('bgColorElement');
            this.fgColorElement = document.getElementById('fgColorElement');
            this.pencilToolElement = document.getElementById('pencil-tool');
            this.lineToolElement = document.getElementById('line-tool');

            // Set initial state
            this.setBackgroundColor("#FFFFFF");
            this.setForegroundColor("#000000");
            this.setCurrentTool(Toolbox.PENCIL_TOOL);

            // Setup up event handlers
            this.registerHandlers();
        }
        registerHandlers(){
            this.lineToolElement.onclick = (event) => {
                this.setCurrentTool(Toolbox.LINE_TOOL);
            };
            this.pencilToolElement.onclick = (event) => {
                this.setCurrentTool(Toolbox.PENCIL_TOOL);
            };
            this.bgColorElement.onclick = (event) => {
                const newBackgroundColor = window.prompt("New Background Color Code ? ", this.currentBgColor);
                if(newBackgroundColor !== null){
                    const oldBgColor = this.currentBgColor;
                    this.setBackgroundColor(newBackgroundColor);
                    if(this.bgColorChangedHandler !== null && this.bgColorChangedHandler !== undefined) this.bgColorChangedHandler(newBackgroundColor, oldBgColor);
                }

            };
            this.fgColorElement.onclick = (event) => {
                const newForegroundColor = window.prompt("New Foreground Color Code ? ", this.currentFgColor);
                if(newForegroundColor !== null) {
                    const oldFgColor = this.currentFgColor;
                    this.setForegroundColor(newForegroundColor);
                    if(this.fgColorChangedHandler !== null && this.fgColorChangedHandler !== undefined) this.fgColorChangedHandler(newForegroundColor, oldFgColor);
                }
            };
        }
        onBgColorChanged(eventHandler){
            this.bgColorChangedHandler = eventHandler;
        }
        onFgColorChanged(eventHandler){
            this.fgColorChangedHandler = eventHandler;
        }
        onToolChanged(eventHandler){
            this.toolChangedHandler = eventHandler;
        }
        setCurrentTool(code){
            const oldToolCode = this.currentTool;
            if(this.currentToolElement !== null && this.currentToolElement !== undefined) this.currentToolElement.classList.remove('activated');
            switch(code){
                case Toolbox.PENCIL_TOOL:
                    this.currentToolElement = this.pencilToolElement;
                    this.currentTool = Toolbox.PENCIL_TOOL;
                    break;
                case Toolbox.LINE_TOOL:
                    this.currentToolElement = this.lineToolElement;
                    this.currentTool = Toolbox.LINE_TOOL;

            }
            this.currentToolElement.classList.add('activated');
            if(oldToolCode !== this.currentTool){ // When current tool change to different tool
                if(this.toolChangedHandler !== null && this.toolChangedHandler !== undefined)
                    this.toolChangedHandler(this.currentTool);
            }
        }
        setForegroundColor(colorCode){
            this.currentFgColor = colorCode;
            this.fgColorElement.style.backgroundColor = this.currentFgColor;
        }
        setBackgroundColor(colorCode){
            this.currentBgColor = colorCode;
            this.bgColorElement.style.backgroundColor = this.currentBgColor;
        }
    }
    const body = document.getElementById('myCanvas');
    const pixelSpace = []; // Contains all pixels on screen
    let startPixel = null; // Save initially clicked pixel
    let pixelPressed = false;
    let canvasWidth = 0; // Current width of canvas
    let canvasHeight = 0; // Current height of canvas
    // Get element references
    const canvasWidthElement = document.getElementById('canvasWidthBox');
    const canvasHeightElement = document.getElementById('canvasHeightBox');
    const createCanvasButton = document.getElementById('createCanvasBtn');
    const clearCanvasButton = document.getElementById('clearCanvasBtn');

    // Create Toolbox
    const myToolBox = new Toolbox('myToolBox');
    // Register click listeners
    createCanvasButton.onclick = function(event){
        const width = parseInt(canvasWidthElement.value);
        const height = parseInt(canvasHeightElement.value);
        console.log(`Creating canvas of size ${width}(w) x ${height}(h)`);
        canvasHeightElement.value = "";
        canvasWidthElement.value = "";
        makeCanvas(pixelSpace, body, height, width);
    };
    clearCanvasButton.onclick = function(event){
        // Redraw the canvas with saved dimensions to clear the drawing
        makeCanvas(pixelSpace, body, canvasHeight, canvasWidth);
    };
    myToolBox.onBgColorChanged(updateCanvasBgColor);
    myToolBox.onFgColorChanged(updateCanvasFgColor);
    myToolBox.onToolChanged(updateCanvasTool);


    class Pixel{
        constructor(x, y, element){
            this.x = x;
            this.y = y;
            this.clicked = false;
            this.element = element;
            this.color = myToolBox.currentBgColor;
        }
        setColor(color){
            this.color = color;
            this.element.style.backgroundColor = this.color;
        }
        registerOnClickAction(clickAction){
            this.element.onclick = (event) => {
                this.clicked = !this.clicked;
                clickAction(event, this);
            };
        }
        registerOnHoverAction(hoverAction){
            this.element.onmouseenter = (event) => {
                hoverAction(event, this);
            };
        }
        plot(){
            //console.log(`Plotting pixel : (${this.x}, ${this.y})`);
            this.clicked = true;
            this.setColor(myToolBox.currentFgColor);
        }
    }

    function makeCanvas(pixelMap, canvasElement, height, width){
        // Clear saved canvas width and height
        canvasWidth = 0;
        canvasHeight = 0;
        // Clear the currently saved start Pixel if any
        startPixel = null;
        // Clear the CanvasElement HTML to No Canvas message
        canvasElement.innerHTML = "<h1 style=\"color: #AAAAAA;position:fixed;top:0;left:0;text-align:center;margin-top:50vh;width:85%;\">No Canvas</h1>";
        // Clear Pixels Space
        pixelMap.forEach((pixelCol) => {
            for(let row=0; row<pixelCol.length; row++){
                pixelCol[row] = null;
            }
        });
        if(width > 0 && height > 0){ // Only create canvas when width and height are specified properly
            // Clear HTML first
            canvasElement.innerHTML = "";
            // Making canvas
            const table = document.createElement("table");
            canvasElement.insertAdjacentElement('afterbegin', table);
            for(let i=0; i<height; i++){
                pixelSpace[i] = [];
                const tableRow = document.createElement("tr");
                tableRow.classList.add("row");
                table.insertAdjacentElement('afterbegin', tableRow);
                for(let j=0; j<width; j++){
                    const tableCell = document.createElement("td");
                    tableCell.classList.add("pixel");
                    tableRow.appendChild(tableCell);
                    pixelSpace[i][j] = new Pixel(i, j, tableCell); // j(cols) for x-axis and i(rows) for y-axis
                    if(myToolBox.currentTool === Toolbox.LINE_TOOL){
                        // Register click event
                        pixelSpace[i][j].registerOnClickAction(function(event, pixel) {
                            if(startPixel === null) { // When no pixel on screen was clicked
                                startPixel = pixel;
                                pixel.element.style.backgroundColor = myToolBox.currentFgColor;
                            }else{ // When 2nd pixel is clicked
                                if(startPixel.x === pixel.x && startPixel.y === pixel.y){ // When start and end pixels are same
                                    // reset pixel
                                    pixel.element.style.backgroundColor = myToolBox.currentFgColor;
                                }else{ // We get two distinct points and we need to use DDA Algorithm to draw a line between these pixels
                                    drawLineUsingDDA(pixelSpace, startPixel, pixel); // Start and End Pixels
                                }
                                startPixel = null; // Clear selected Pixels
                            }
                        });
                    }else if(myToolBox.currentTool === Toolbox.PENCIL_TOOL) {
                        pixelSpace[i][j].registerOnHoverAction(function (event, pixel) {
                            if(pixelPressed === true){
                                pixel.setColor(myToolBox.currentFgColor);
                            }
                        });
                    }
                    pixelSpace[i][j].setColor(myToolBox.currentBgColor);
                }
            }

            // Canvas Events
            canvasElement.onmousedown = (event) => {
                pixelPressed = true;
            };
            canvasElement.onmouseup = (event) => {
                pixelPressed = false;
            };
        }
        // Save current width and height of canvas
        canvasWidth = width;
        canvasHeight = height;
    }
    function updateCanvasBgColor(newBgColor, oldBgColor){
        console.log("Updating Background color from " + oldBgColor + " to " + newBgColor);
        for(let x=0; x<pixelSpace.length; x++){
            for(let y=0; y<pixelSpace[x].length; y++){
                console.log("Current Color : " + pixelSpace[x][y].color + " Old Color : " + oldBgColor);
                if(pixelSpace[x][y].color === oldBgColor){
                    // Current pixel is already drawn
                    pixelSpace[x][y].setColor(newBgColor);
                }
            }
        }
    }
    function updateCanvasFgColor(newFgColor, oldFgColor){
        console.log("Updating Foreground color from " + oldFgColor + " to " + newFgColor);
        if(startPixel !== null) startPixel.setColor(newFgColor);
    }
    function updateCanvasTool(newToolCode){
        // Save current canvas color map
        const colorMap = [];
        pixelSpace.forEach((pixelRow, x) => {
            colorMap[x] = [];
            pixelRow.forEach((pixel, y) =>{
                colorMap[x][y] = pixel.color;
            });
        });
        // Regenerate canvas along with registering events on the basis of selected tool
        makeCanvas(pixelSpace, body, canvasHeight, canvasWidth);
        // Load the saved color map into canvas
        pixelSpace.forEach((pixelRow, x) => {
            pixelRow.forEach((pixel, y) =>{
               pixel.setColor(colorMap[x][y]);
            });
        });
        console.log("Tool Changed : Code-" + newToolCode);
    }

    /**
     *
     * @param pixels PixelSpace containing Pixel objects for all the pixels of the screen
     * @param startPixel Initial Pixel from which to start drawing line
     * @param endPixel Ending Pixel at which to stop drawing line
     */
    function drawLineUsingDDA(pixels, startPixel, endPixel){
        console.log(`drawing line from (${startPixel.x}, ${startPixel.y}) to (${endPixel.x}, ${endPixel.y})`);
        let dX = Math.abs(endPixel.x - startPixel.x);
        let dY = Math.abs(endPixel.y - startPixel.y);
        let length = (dX >= dY) ? dX : dY;
        dX = (endPixel.x - startPixel.x) / length; // X-increments for length
        dY = (endPixel.y - startPixel.y) / length; // Y-increments for length
        let x = startPixel.x + 0.5 * Math.sin(dX);
        let y = startPixel.y + 0.5 * Math.sin(dY);
        for(let i=1; i<=length; i++){

            plotPixel(pixels, x, y);
            x = x + dX;
            y = y + dY;
        }
    }

    /**
     *
     * @param pixels PixelSpace containing Pixel objects for all the pixels of the screen
     * @param x x-coordinate of pixel to be drawn
     * @param y y-coordinate of pixel to be drawn
     */
    function plotPixel(pixels, x, y){
        x = parseInt(x);
        y = parseInt(y);
        pixels[x][y].plot();
        console.log(`Plotted pixel : (${x}, ${y})`);
    }
})();
