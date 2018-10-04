// IEFE
(function(){
    class Toolbox{
        static get LINE_TOOL() {return 101};
        static get PENCIL_TOOL() {return 102};
        static get CIRCLE_TOOL() {return 103};
        constructor(id){
            this.element = document.getElementById(id);
            if(this.element === null){
                console.error("Cannot Instantiate Toolbox : No toolbox found with id " + id);
                return;
            }
            // Get Elements
            this.bgColorElement = document.getElementById('bgColorElement');
            this.fgColorElement = document.getElementById('fgColorElement');
            this.bgColorInput = document.getElementById('bgColorInput');
            this.fgColorInput = document.getElementById('fgColorInput');
            this.pencilToolElement = document.getElementById('pencil-tool');
            this.lineToolElement = document.getElementById('line-tool');
            this.circleToolElement = document.getElementById('circle-tool');
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
            this.circleToolElement.onclick = (event) => {
                this.setCurrentTool(Toolbox.CIRCLE_TOOL);
            };
            this.bgColorElement.onclick = (event) => {
                this.bgColorInput.click();
            };
            this.bgColorInput.onchange = (event) => {
                const newBackgroundColor = this.bgColorInput.value;
                if(newBackgroundColor !== null){
                    const oldBgColor = this.currentBgColor;
                    this.setBackgroundColor(newBackgroundColor);
                    if(this.bgColorChangedHandler !== null && this.bgColorChangedHandler !== undefined) this.bgColorChangedHandler(newBackgroundColor, oldBgColor);
                }
            };
            this.fgColorElement.onclick = (event) => {
                this.fgColorInput.click();
            };
            this.fgColorInput.onchange = (event) => {
                const newForegroundColor = this.fgColorInput.value;
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
                    break;
                case Toolbox.CIRCLE_TOOL:
                    this.currentToolElement = this.circleToolElement;
                    this.currentTool = Toolbox.CIRCLE_TOOL;
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
    let canvasPixelSize = 0; // Current pixel size of canvas
    let showBorder = false;
    // Get element references
    const canvasWidthElement = document.getElementById('canvasWidthBox');
    const canvasHeightElement = document.getElementById('canvasHeightBox');
    const pixelSizeElement = document.getElementById('pixelSizeBox');
    const showBorderBox = document.getElementById('showBorderBox');
    const createCanvasButton = document.getElementById('createCanvasBtn');
    const clearCanvasButton = document.getElementById('clearCanvasBtn');
    // Create Toolbox
    const myToolBox = new Toolbox('myToolBox');
    // Register click listeners
    createCanvasButton.onclick = function(event){
        const width = parseInt(canvasWidthElement.value);
        const height = parseInt(canvasHeightElement.value);
        const pixelSize = parseInt(pixelSizeElement.value)/10; // starts from 0.0 to 0.xx (in em)
        console.log(`Creating canvas of size ${width}(w) x ${height}(h) with pixel size:${pixelSize}`);
        canvasHeightElement.value = "";
        canvasWidthElement.value = "";
        pixelSizeElement.value = "";
        showBorderBox.checked = false;
        makeCanvas(pixelSpace, body, height, width, pixelSize, showBorderBox.checked);
    };
    clearCanvasButton.onclick = function(event){
        // Redraw the canvas with saved dimensions to clear the drawing
        makeCanvas(pixelSpace, body, canvasHeight, canvasWidth, canvasPixelSize, showBorder);
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

    function makeCanvas(pixelMap, canvasElement, height, width, pixelSize, showBorderFlag){
        // Clear saved canvas width and height and pixelsize
        canvasWidth = 0;
        canvasHeight = 0;
        canvasPixelSize = 0;
        showBorder = false;
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
            const table = document.createElement("div");
            table.classList.add("table");
            canvasElement.insertAdjacentElement('afterbegin', table);
            for(let i=0; i<height; i++){
                pixelSpace[i] = [];
                const tableRow = document.createElement("div");
                tableRow.classList.add("row");
                table.insertAdjacentElement('afterbegin', tableRow);
                for(let j=0; j<width; j++){
                    const tableCell = document.createElement("div");
                    tableCell.classList.add("cell");
                    tableCell.style.width = pixelSize.toString() + "em"; // Set pixel width
                    tableCell.style.height = pixelSize.toString() + "em"; // Set pixel height
                    if(showBorderFlag) tableCell.style.border = "0.5px solid #cccccc";
                    tableRow.appendChild(tableCell);
                    pixelSpace[i][j] = new Pixel(i, j, tableCell); // j(cols) for x-axis and i(rows) for y-axis
                    if(myToolBox.currentTool === Toolbox.LINE_TOOL || myToolBox.currentTool === Toolbox.CIRCLE_TOOL){
                        // Register click event
                        pixelSpace[i][j].registerOnClickAction(function(event, pixel) {
                            if(startPixel === null) { // When no pixel on screen was clicked
                                startPixel = pixel;
                                pixel.setColor(myToolBox.currentFgColor);
                            }else{ // When 2nd pixel is clicked
                                if(startPixel.x === pixel.x && startPixel.y === pixel.y){ // When start and end pixels are same
                                    // reset pixel
                                    pixel.setColor(myToolBox.currentBgColor);
                                }else{ // We get two distinct points and we need to use DDA Algorithm to draw a line between these pixels
                                    if(myToolBox.currentTool === Toolbox.LINE_TOOL) {
                                        drawLineUsingBresenham(pixelSpace, startPixel, pixel); // Start and End Pixels
                                    }else{
                                        // Find Radius
                                        const dX = pixel.x - startPixel.x;
                                        const dY = pixel.y - startPixel.y;
                                        const radius = Math.trunc(Math.sqrt(dX*dX + dY*dY));
                                        drawCircle(pixelSpace, startPixel, radius);
                                        startPixel.setColor(myToolBox.currentBgColor);
                                    }
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
        canvasPixelSize = pixelSize;
        showBorder = showBorderFlag;
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
        makeCanvas(pixelSpace, body, canvasHeight, canvasWidth, canvasPixelSize, showBorder);
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
     * Draws a line from startPixel to endPixel on pixels (Pixel Grid) using Bresenham's Line Drawing Algorithm
     * @param pixels Pixel Grid array for Drawing
     * @param startPixel pixel object to start drawing line from.
     * @param endPixel pixel object representing line end point
     */
    function drawLineUsingBresenham(pixels, startPixel, endPixel){
        let dX = endPixel.x - startPixel.x; // Calculate change in X
        let dY = endPixel.y - startPixel.y; // Calculate change in Y
        let slope = parseInt(dY/dX); // Calculate slope
        console.log(`drawing line from (${startPixel.x}, ${startPixel.y} to (${endPixel.x}, ${endPixel.y}) with dX:${dX}, dY:${dY} and slope:${slope}`);
        if(dX >= 0 && dY >= 0){ // Ist Quadrant Case
            if(slope < 1){ // When either both X and Y have same rate of change or X rate of change is more than Y
                let decisionParam = 2*dY - dX; // Initial decision parameter
                // Initial Coordinates
                let x = startPixel.x;
                let y = startPixel.y;
                while(x<=endPixel.x){ // Repeat until we reach beyond end coordinates
                    pixels[x][y].plot();  // Plot the point
                    console.log("Plotting : ("+x+ ", " + y + ") and next decision parameter : " + decisionParam);
                    const prevY = y;
                    if(decisionParam >= 0){
                        // Increment both coordinates
                        x = x+1;
                        y = y+1;
                    }else{
                        x = x+1; // Increment x only
                    }
                    // update decision parameter
                    decisionParam = decisionParam + 2*dY - 2*dX * (y-prevY);
                }
            }else{ // When change in Y is more than change in X
                let decisionParam = 2*dX-dY;
                // Initial Coordinates
                let x = startPixel.x;
                let y = startPixel.y;
                while(y<=endPixel.y){
                    pixels[x][y].plot(); // Plot the point
                    console.log("Plotting : ("+x+ ", " + y + ") and next decision parameter : " + decisionParam);
                    const prevX = x;
                    if(decisionParam >= 0){
                        // Increment both coordinates
                        x = x+1;
                        y = y+1;
                    }else{
                        // Increment Y only
                        y = y+1;
                    }
                    // Update Decision Parameter
                    decisionParam = decisionParam + 2*dX - 2*dY * (x-prevX);
                }
            }
        }else if(dX < 0 && dY >= 0){ // IInd Quadrant case
            dX = -dX;
            if(slope > -1){ // When either both X and Y have same rate of change or X rate of change is more than Y
                let decisionParam = 2*dY - dX; // Initial decision parameter
                // Initial Coordinates
                let x = startPixel.x;
                let y = startPixel.y;
                while(endPixel.x<=x){ // Repeat until we reach beyond end coordinates
                    pixels[x][y].plot();  // Plot the point
                    console.log("Plotting : ("+x+ ", " + y + ") and next decision parameter : " + decisionParam);
                    const prevY = y;
                    if(decisionParam >= 0){
                        // Increment both coordinates
                        x = x-1;
                        y = y+1;
                    }else{
                        x = x-1; // Increment x only
                    }
                    // update decision parameter
                    decisionParam = decisionParam + 2*dY - 2*dX * (y-prevY);
                }
            }else{ // When change in Y is more than change in X
                let decisionParam = 2*dX - dY;
                // Initial Coordinates
                let x = startPixel.x;
                let y = startPixel.y;
                while(y<=endPixel.y){
                    pixels[x][y].plot(); // Plot the point
                    console.log("Plotting : ("+x+ ", " + y + ") and next decision parameter : " + decisionParam);
                    const prevX = x;
                    if(decisionParam >= 0){
                        // Increment both coordinates
                        x = x-1;
                        y = y+1;
                    }else{
                        // Increment Y only
                        y = y+1;
                    }
                    // Update Decision Parameter
                    decisionParam = decisionParam + 2*dX - 2*dY * (prevX-x);
                }
            }
        }else if(dX < 0 && dY < 0){
            dX = -dX;
            dY = -dY;
            if(slope < 1){ // When either both X and Y have same rate of change or X rate of change is more than Y
                let decisionParam = 2*dY - dX; // Initial decision parameter
                // Initial Coordinates
                let x = startPixel.x;
                let y = startPixel.y;
                while(endPixel.x<=x){ // Repeat until we reach beyond end coordinates
                    pixels[x][y].plot();  // Plot the point
                    console.log("Plotting : ("+x+ ", " + y + ") and next decision parameter : " + decisionParam);
                    const prevY = y;
                    if(decisionParam >= 0){
                        // Increment both coordinates
                        x = x-1;
                        y = y-1;
                    }else{
                        x = x-1; // Increment x only
                    }
                    // update decision parameter
                    decisionParam = decisionParam + 2*dY - 2*dX * (prevY-y);
                }
            }else{ // When change in Y is more than change in X
                let decisionParam = 2*dX - dY;
                // Initial Coordinates
                let x = startPixel.x;
                let y = startPixel.y;
                while(endPixel.y<=y){
                    pixels[x][y].plot(); // Plot the point
                    console.log("Plotting : ("+x+ ", " + y + ") and next decision parameter : " + decisionParam);
                    const prevX = x;
                    if(decisionParam >= 0){
                        // Increment both coordinates
                        x = x-1;
                        y = y-1;
                    }else{
                        // Increment Y only
                        y = y-1;
                    }
                    // Update Decision Parameter
                    decisionParam = decisionParam + 2*dX - 2*dY * (prevX-x);
                }
            }
        }else if(dX >= 0 && dY < 0){
            dY = -dY;
            if(slope > -1){ // When either both X and Y have same rate of change or X rate of change is more than Y
                let decisionParam = 2*dY - dX; // Initial decision parameter
                // Initial Coordinates
                let x = startPixel.x;
                let y = startPixel.y;
                while(x<=endPixel.x){ // Repeat until we reach beyond end coordinates
                    pixels[x][y].plot();  // Plot the point
                    console.log("Plotting : ("+x+ ", " + y + ") and next decision parameter : " + decisionParam);
                    const prevY = y;
                    if(decisionParam >= 0){
                        // Increment both coordinates
                        x = x+1;
                        y = y-1;
                    }else{
                        x = x+1; // Increment x only
                    }
                    // update decision parameter
                    decisionParam = decisionParam + 2*dY - 2*dX * (prevY-y);
                }
            }else{ // When change in Y is more than change in X
                let decisionParam = 2*dX - dY;
                // Initial Coordinates
                let x = startPixel.x;
                let y = startPixel.y;
                while(endPixel.y<=y){
                    pixels[x][y].plot(); // Plot the point
                    console.log("Plotting : ("+x+ ", " + y + ") and next decision parameter : " + decisionParam);
                    const prevX = x;
                    if(decisionParam >= 0){
                        // Increment both coordinates
                        x = x+1;
                        y = y-1;
                    }else{
                        // Increment Y only
                        y = y-1;
                    }
                    // Update Decision Parameter
                    decisionParam = decisionParam + 2*dX - 2*dY * (x-prevX);
                }
            }
        }
    }

    /**
     * Draws a circle on the Pixel Grid using Circle Mid Point Algorithm
     * @param pixels Pixel Grid array for Drawing
     * @param centerPixel Center of the circle
     * @param radius  Radius of the circle
     */
    function drawCircle(pixels, centerPixel, radius){
        // Create circle relative to origin (0,0)
        let x = 0; // Initial x-coordinate
        let y = radius; // Initial y-coordinate
        let decisionParam = 1 - radius; // Initial Decision Parameter
        console.log(`Drawing circle at center: (${centerPixel.x}, ${centerPixel.y}) with radius:${radius} and initial decision parameter:${decisionParam}`);
        // Array to store set of points along the circle path
        let circlePoints = [];
        while(x <= y){ // Get all points lies on the edge of upper octant in Ist Quadrant (where y-coordinate value >= x-coordinate value)
            console.log(`Current Pixel : (${x}, ${y}) and Decision Parameter : ${decisionParam}`);
            circlePoints.push({x: x, y: y}); // Push coordinates to set of circle points
            const prevY = y; // Save current y
            const prevX = x; // Save current x
            // Get next point using current decision parameter
            if(decisionParam>=0){
                x = x+1;
                y = y-1;
            }else{
                x = x+1;
            }
            // Update decision parameter
            decisionParam = decisionParam + 2*(prevX+1) + ((y*y)-(prevY*prevY)) - (y-prevY) + 1;
        }
        // plot all points stored in circlePoints and rest of the points using circle symmetry
        circlePoints.forEach((pixel) => {
            // Plot circle points relative to the centerPixel coordinates
            // Note: circlePoints have points relative to origin so we just need to add them to or subtract them from (based on symmetry)
            // centerPixel coordinates to get actual points to plot.
            const pixelX = pixel.x + centerPixel.x;
            const pixelY = pixel.y + centerPixel.y;
            plotPixel(pixels, pixelX, pixelY);
            plotPixel(pixels, centerPixel.x-pixel.x, centerPixel.y-pixel.y);
            plotPixel(pixels, centerPixel.x+pixel.x, centerPixel.y-pixel.y);
            plotPixel(pixels, centerPixel.x-pixel.x, centerPixel.y+pixel.y);

            plotPixel(pixels, centerPixel.x+pixel.y, centerPixel.y+pixel.x);
            plotPixel(pixels, centerPixel.x-pixel.y, centerPixel.y-pixel.x);
            plotPixel(pixels, centerPixel.x+pixel.y, centerPixel.y-pixel.x);
            plotPixel(pixels, centerPixel.x-pixel.y, centerPixel.y+pixel.x);
        });
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
        // Only draw pixel if it is within boundaries of pixel grid (to handle circle pixels computed outside grid)
        if(x>=0 && x<pixels.length && y>=0 && y<pixels[0].length)
            pixels[x][y].plot();
        console.log(`Plotted pixel : (${x}, ${y})`);
    }
})();