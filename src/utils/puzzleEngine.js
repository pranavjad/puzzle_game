/*
--------------------------------
This section defines some variables that are used throughout the program.
The endpoint url is the API endpoint for the Chicago Institue of Art API from which the images are sourced.
https://www.artic.edu/open-access/public-api
--------------------------------
*/
function sketchGenerator(url, imgW, imgH, xpiececnt) {
    let imageURL = url;
    let img;
    let resizedImg;
    let pieces = [];
    let imageLoaded = false;
    let loadRandom = true;
    let pieceGen = false;
    let pieceCount = [2,0];
    let xDims;
    let yDims;
    let prefxDims;
    let prefyDims;
    let currentlyGrabbed = null;
    let piecesToDraw = [];
    let pieceMap;
    let maxDim;
    let density;
    let origMouseX,origMouseY;

    /*
    --------------------------------
    This section defines a number of cusotm utility functions that are used throughout the game and piece generation logic.
    --------------------------------
    */



    // get a third point along a line defined by the two points (x1,y1) and (x2,y2)
    // r (int) controls how far this returned point is from (x2,y2)
    // this used to help generate the coordinates that define the bezier curves for the shape of a piece.
    function getLine(x1,y1,x2,y2,r){
        return [x2 + Math.floor((x2-x1)/r),y2 + Math.floor((y2-y1)/r)];
    }

    // partition an integer n into p parts which are as equal as possible
    // used when cutting up the image to make the puzzle pieces
    function partition(n,p){
        let base = Math.floor(n/p);
        let remainder = n % base;
        let add = Math.ceil(remainder/p);
        let res = [];
        for(let i = 0;i<p;i++){
            let x = base;
            if(remainder-add>=0) {
                remainder-=add;
                x+=add;
            }
            else {
                x+=remainder;
                remainder = 0;
            }
            res.push(x);
        }
        return res;
    }

    // normalize a dimension (such as a piece's width or height) to a parmeter (some integer)
    // this is used so that the values that control the sharpness of the pieces curves
    // are adjusted when the piece size increases or decreases (more pieces = smaller pieces).
    // if this was not there, when the pieces became smaller the curves would still be too sharp
    // and they would curve in on themselves.
    function normalize(dim,parameter,to=100){
        return Math.ceil((parameter/to)*dim);
    }

    // return a random length 4 array consisting of 1s and -1s
    // this governs the shape of the 4 sides of a puzzle peice
    // 1 = protruding out
    // -1 = protruding in
    function getRandomOrientations(){
        let res = []
        for(let i = 0;i<4;i++){
            let r = Math.random();
            if(r>=0.5) res.push(1);
            else res.push(-1);
        }
        return res;
    }

    // nudge a length 2 array (point) by a factor d
    // this function is used in order to introduce some randomness in the puzzle pieces
    function nudge(point,d){
        let x = Math.floor(Math.random() * d);
        let y = Math.floor(Math.random() * d);
        let xSign = (Math.random()>=0.5)? 1 : -1;
        let ySign = (Math.random()>=0.5)? 1 : -1;
        point[0] += (x*xSign);
        point[1] += (y*ySign);
    }

    // Add two vectors represented by length 2 arrays together
    // set the parameter 's' to -1 to subtract
    function vecAdd(a,b,s=1){
        return [a[0]+(b[0]*s),a[1]+(b[1]*s)];
    }

    // return the distance between two points
    function pointDist(x1,y1,x2,y2){
        return Math.sqrt(
            Math.pow(y2-y1,2) + Math.pow(x2-x1,2)
        );
    }

    /*
    params:
    point - length 2 array
    origin - length 2 array
    functionality:
    rotate the point 90 degrees counterclockwise about the origin
    */
    function rotate90ccw(point,origin){
        let xDist = point[0] - origin[0];
        let yDist = point[1] - origin[1];
        return vecAdd(origin,[-yDist,xDist])
    }

    // class to hold all the data associated with a piece that is used during piece generation
    class myPiece {
        constructor(skin,skinNoBorder,orientations,pieceRow,pieceCol,pieceData,id,x,y){
            this.skin = skin;
            this.skinNoBorder = skinNoBorder;
            this.orientations = orientations;
            this.row = pieceRow;
            this.col = pieceCol;
            this.data = pieceData;
            this.id = id;
            this.x = x;
            this.y = y;
        }
    }

    // class to hold the data associated with a piece used during puzzle play
    class lightPiece {
        constructor(skin,skinNoBorder,x,y,row,col,id,data){
            this.skin = skin;
            this.skinNoBorder = skinNoBorder;
            this.x = x;
            this.y = y;
            this.row = row;
            this.col = col;
            this.id = id;
            this.data = data;
            this.neighbors = [];
            this.grabbed = false;
            this.originalGrabbedX = 0;
            this.originalGrabbedY = 0;
        }
    }

    // generate a random x,y coordinate pair
    // used to randomly place the pieces on the board at the start of the puzzle game
    function getRandomPosition(xmin=0,xmax,ymin=0,ymax){
        let x = Math.floor(Math.random() * (xmax-xmin+1)) + xmin;
        let y = Math.floor(Math.random() * (ymax-ymin+1)) + ymin;
        return [x,y];
    }

    // tile: lightPiece
    // Have a piece follow the position of another piece.
    // Used when multiple pieces must move in sync when they are fit together.
    function followPosition(tile,x_init,y_init,x_final,y_final){
        tile.x += x_final - x_init;
        tile.y += y_final - y_init;
    }

    // Whenever two groups of pieces are fit together
    // this function is used to correctly update the neighbor arrays of both pieces
    function combineGroups(piece1,piece2){
        let group1 = piece1.neighbors.slice();
        group1.push(piece1.id);
        let group2 = piece2.neighbors.slice();
        group2.push(piece2.id);
        for(let o of piece1.neighbors){
            pieceMap[o].neighbors.push(...group2);
        }
        piece1.neighbors.push(...group2);
        for(let o of piece2.neighbors){
            pieceMap[o].neighbors.push(...group1);
        }
        piece2.neighbors.push(...group1);
    }

    // check if piece has is close enough to snap to a fit. If there is a fit, snap the piece and its neighbors, and return true.
    // Otherswise return false
    function fit(piece){
        let xy = [piece.x,piece.y];
        let curTopLeft = vecAdd(piece.data.topLeft,xy);
        let curTopRight = vecAdd(piece.data.topRight,xy);
        let curBotLeft = vecAdd(piece.data.botLeft,xy);
        let curBotRight = vecAdd(piece.data.botRight,xy);
        let x_init = piece.x;
        let y_init = piece.y;
        let fitSens = 12;
        // check for TOP fit
        if(piece.row > 0 && !piece.neighbors.includes(piece.id - pieceCount[0])){
            let top = pieceMap[piece.id - pieceCount[0]];
            // console.log(top)
            let xyt = [top.x,top.y];
            let topBotLeft = vecAdd(top.data.botLeft,xyt);
            let topBotRight = vecAdd(top.data.botRight,xyt)
            // check if distance between the pieces to be fit is less than the fit sensitivity threshold (fitSens)
            if(pointDist(...curTopLeft,...topBotLeft)<fitSens && pointDist(...curTopRight,...topBotRight)<fitSens){
                // console.log("top fit");
                // update the piece position and positions of all of its neighbors to animate the piece snapping to its new neighbor
                [piece.x,piece.y] = vecAdd(topBotLeft,piece.data.topLeft,-1);
                for(let o of piece.neighbors){
                    followPosition(pieceMap[o],x_init,y_init,piece.x,piece.y);
                }
                // update the neighbor array of the piece and its neighbor that just fit together
                combineGroups(piece,top);
                return true;
            }
        }
        // check for BOTTOM fit
        if(piece.row+1 < pieceCount[1] && !piece.neighbors.includes(piece.id + pieceCount[0])){
            let bot = pieceMap[piece.id + pieceCount[0]];
            // console.log(pieceMap, piece.id, pieceCount);
            let xyb = [bot.x,bot.y];
            let botTopLeft = vecAdd(bot.data.topLeft,xyb);
            let botTopRight = vecAdd(bot.data.topRight,xyb);
            // check if distance between the pieces to be fit is less than the fit sensitivity threshold (fitSens)
            if(pointDist(...curBotLeft,...botTopLeft)<fitSens && pointDist(...curBotRight,...botTopRight)<fitSens){
                // console.log("bot fit");
                // console.log(piece.id,bot.id);
                // update the piece position and positions of all of its neighbors to animate the piece snapping to its new neighbor
                [piece.x,piece.y] = vecAdd(botTopLeft,piece.data.botLeft,-1);
                for(let o of piece.neighbors){
                    followPosition(pieceMap[o],x_init,y_init,piece.x,piece.y);
                }
                // update the neighbor array of the piece and its neighbor that just fit together
                combineGroups(piece,bot);
                return true;
            }
        }
        // check for LEFT fit
        if(piece.col > 0 && !piece.neighbors.includes(piece.id-1)){
            let left = pieceMap[piece.id-1];
            let xyl = [left.x,left.y];
            let leftTopRight = vecAdd(left.data.topRight,xyl);
            let leftBotRight = vecAdd(left.data.botRight,xyl);
            // check if distance between the pieces to be fit is less than the fit sensitivity threshold (fitSens)
            if(pointDist(...curBotLeft,...leftBotRight)<fitSens && pointDist(...curTopLeft,...leftTopRight)<fitSens){
                // console.log("left fit");
                // update the piece position and positions of all of its neighbors to animate the piece snapping to its new neighbor
                [piece.x,piece.y] = vecAdd(leftBotRight,piece.data.botLeft,-1);
                for(let o of piece.neighbors){
                    followPosition(pieceMap[o],x_init,y_init,piece.x,piece.y);
                }
                // update the neighbor array of the piece and its neighbor that just fit together
                combineGroups(piece,left);
                return true;
            }
        }
        // check for RIGHT fit
        if(piece.col+1 < pieceCount[0] && !piece.neighbors.includes(piece.id+1)){
            let right = pieceMap[piece.id+1];
            let xyr = [right.x,right.y];
            let rightBotLeft = vecAdd(right.data.botLeft,xyr);
            let rightTopLeft = vecAdd(right.data.topLeft,xyr);
            // check if distance between the pieces to be fit is less than the fit sensitivity threshold (fitSens)
            if(pointDist(...curBotRight,...rightBotLeft)<fitSens && pointDist(...curTopRight,...rightTopLeft)<fitSens){
                // console.log("right fit");
                // update the piece position and positions of all of its neighbors to animate the piece snapping to its new neighbor
                [piece.x,piece.y] = vecAdd(rightTopLeft,piece.data.topRight,-1);
                for(let o of piece.neighbors){
                    followPosition(pieceMap[o],x_init,y_init,piece.x,piece.y);
                }
                // update the neighbor array of the piece and its neighbor that just fit together
                combineGroups(piece,right);
                return true;
            }
        }
        return false;
    }


    /*
    --------------------------------
    This section defines the p5 sketch that is used to be the puzzle interface.
    p5 is a graphics library for js (https://p5js.org/).

    This file defines the interface allows the user to move pieces around with their mouse,
    rotate pieces with the 'a' key on the keyboard, and use the spacebar
    to toggle view of the reference image.

    This file also contains the logic for generating and cutting out the puzzle pieces from
    the image.
    --------------------------------
    */

    // sketch is a function which defines the logic of the game
    // 'p' is the p5 object which allows access to p5 specific functions.
    // *** Any function this file prefixed by 'p.' (ie. p.preload, p.loadImage, p.draw, etc.) is a p5 library function. ***
    // credit for these functions to p5.
    let sketch = function(p) {
        
        // preload is a function p5 expects which is run before the main game loop
        // it is used to load images
        p.preload = function() {
            if(loadRandom){
                p.loadImage(imageURL,function(i){
                    img = i;
                    imageLoaded=true;
                });
            }
            else {
                let defaultImg = "https://www.artic.edu/iiif/2/4a87e43e-8777-d36f-126d-545286eb9c4f/full/843,/0/default.jpg";
                p.loadImage(defaultImg,function(i){
                    img = i;
                    imageLoaded=true;
                });
            }  
        }
        
        // setup is function p5 expects to initialize the game canvas to render things on.
        p.setup = function() {
            p.createCanvas(document.documentElement.clientWidth, document.documentElement.clientHeight);
            // p.createCanvas(p.windowWidth, p.windowHeight)
            // p.background(0);
            // p.pixelDensity(3);
            density = p.pixelDensity();
            // console.log("density: ", density);
            // console.log("main canvas: ", p.width, p.height)
            resizedImg = p.createGraphics(imgW, imgH);
        }

        // draw is a function p5 expects which p5 runs 60 times per second. This is the main game loop where the puzzle
        // pieces are rendered and updated.
        p.draw = function() {

            // if(!imageLoaded) {
            //     // p.color
            //     console.log("image not loaded yet")
            //     p.text('Piss...',p.width/2,p.height/2);
            //     p.fill(255, 255, 255)
            //     return;
            // }

            // if(img==null){
            //     p.background(255);
            //     p.text('Image fetch failed, please reload',p.width/2,p.height/2);
            //     return;
            // }
            // if pieces not generated yet, generate them
            if(!pieceGen){
                console.log("generating puzzle")
                // p.background(255);
                // p.image(img, 0, 0)
                // p.text('Generating Puzzle...',500,500);
                // p.fill(255, 255, 255)
                // resize image to fit on screen and generate piece bounds as squares
                // img.resize(0,p.height*0.75);
                // img.resize(imgW * 4, imgH * 4)
                // img.resize(imgW * 1, imgH * 1)
                // resizedImg.pixelDensity(2)
                resizedImg.copy(img, 0, 0, img.width, img.height, 0, 0, imgW, imgH);
                img = resizedImg
                // img = createImage()
                let imgWHratio = img.height / img.width;
                pieceCount[0] = xpiececnt;
                pieceCount[1] = Math.ceil(pieceCount[0] * imgWHratio);
                // console.log(pieceCount);
                // generate the pieces
                let pieceId = 0;
        
                xDims = partition(img.width,pieceCount[0]);
                yDims = partition(img.height,pieceCount[1]);
                maxDim = Math.max(...xDims,...yDims) *2;

                prefxDims = [0];
                prefyDims = [0];
                for(let i = 0;i<xDims.length-1;i++){
                    prefxDims.push(prefxDims[i] + xDims[i]);
                }
                for(let i = 0;i<yDims.length-1;i++){
                    prefyDims.push(prefyDims[i] + yDims[i]);
                }

                for(let i = 0;i<pieceCount[1];i++){
                    pieces.push([]);
                    for(let j = 0;j<pieceCount[0];j++){
                        let p1 = generatePiece(i,j,pieceId);
                        pieceId++;
                        pieces[i].push(p1);
                    }
                }
                for(let i = 0;i<pieceCount[1];i++){
                    for(let j = 0;j<pieceCount[0];j++){
                        let pieceCol = j;
                        let pieceRow = i;
                        let topLeftX = prefxDims[pieceCol];
                        let topLeftY = prefyDims[pieceRow];
                        let pieceGraphics = p.createGraphics(maxDim,maxDim);
                        pieceGraphics.pixelDensity(2);
                        // console.log("graphics1: ", pieceGraphics.width, pieceGraphics.height)
                        // console.log("d graph: ", pieceGraphics.pixelDensity())
                        pieceGraphics.clear();
                        let center = [maxDim/2,maxDim/2];
                        let pieceCenter = [topLeftX + pieces[i][j].data.width/2,topLeftY + pieces[i][j].data.height/2];
                        pieceGraphics.image(pieces[i][j].skin,center[0]-pieceCenter[0],center[1]-pieceCenter[1]);
                        // pieceGraphics.copy(pieces[i][j].skin, 0, 0, pieces[i][j].skin.width, pieces[i][j].skin.height, center[0]-pieceCenter[0], center[1]-pieceCenter[1], pieces[i][j].skin.width, pieces[i][j].skin.height)
                        let shift = [(center[0]-pieceCenter[0]),(center[1]-pieceCenter[1])];
                        let lightData = {};                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
                        lightData.topLeft = vecAdd(pieces[i][j].data.topLeft,shift);
                        lightData.topRight = vecAdd(pieces[i][j].data.topRight,shift);
                        lightData.botRight = vecAdd(pieces[i][j].data.botRight,shift);
                        lightData.botLeft = vecAdd(pieces[i][j].data.botLeft,shift);
                        lightData.cellCenter = center;
                        lightData.pieceCenter = pieceCenter;

                        // let t = p.createImage(pieceGraphics.width * density, pieceGraphics.height * density);
                        // pieceGraphics.loadPixels();
                        // console.log("piecegraph", pieceGraphics.pixels)
                        // console.log("t", pieceGraphics.width * pieceGraphics.height)
                        // t.loadPixels();
                        // t.pixels.set(pieceGraphics.pixels);
                        // t.updatePixels();
                        // t.copy(pieceGraphics, 0, 0, pieceGraphics.width * density, pieceGraphics.height * density, 0, 0, pieceGraphics.width * density, pieceGraphics.height * density)
                        let p1 = new lightPiece(pieceGraphics,pieces[i][j].skinNoBorder,topLeftX,topLeftY,pieces[i][j].row,pieces[i][j].col,pieces[i][j].id,lightData);
                        // let p1 = new lightPiece(t,pieces[i][j].skinNoBorder,topLeftX,topLeftY,pieces[i][j].row,pieces[i][j].col,pieces[i][j].id,lightData);
                        if(loadRandom){
                            // randomly distribute and rotate the pieces 
                            let pos = getRandomPosition(0,p.width-maxDim,0,p.height-maxDim);
                            p1.x = pos[0] - p1.data.topLeft[0];
                            p1.y = pos[1] - p1.data.topLeft[1];
                            let rotations = Math.floor(Math.random()*4);
                            for(let i = 0;i<rotations;i++){
                                rotatePiece(p1);
                            }
                        } 
                        // clear up the p5 Renderer objects and push the new piece to the list
                        pieceGraphics.remove();
                        pieceGraphics = null;
                        piecesToDraw.push(p1);
                        // console.log("generated a piece")
                    }
                }
                pieces = null;
                pieceMap = piecesToDraw.slice();
                pieceGen=true;
            }
            p.background(0);
            for(let piece of piecesToDraw){
                // p.image(img, 0, 0)
                // p.image(copyImage(img), 0, 0)
                p.image(piece.skin,piece.x,piece.y);
                // p.copy(piece.skin, 0, 0, piece.skin.width, piece.skin.height, piece.x, piece.y, piece.skin.width * (imgW / img.width), piece.skin.height * (imgH / img.height))
                // p.image(resizedImg,(p.width/2) - imgW/2,(p.height/2) - imgH/2, imgW);
                //  p.image(img, 0, 0, img.width,img.height, p.width/2 - imgW,0, imgW, imgH )
                // p.copy(img, 0, 0, img.width * 1, img.height * 1, (p.width/2) - imgW/2, (p.height/2) - imgH/2, imgW, imgH)
                // img.resize(img.width * 2, img.height * 2)
                // p.copy(piece.skin, 0, 0, piece.skin.width, piece.skin.height, piece.x, piece.y, piece.skin.width, piece.skin.height)
            }
        }
        // tells p5 what to do on keypresses.
        p.keyPressed = function() {
            // rotate if 'a' pressed
            if(p.key === 'a' && currentlyGrabbed!=null){
                let originPiece = currentlyGrabbed;
                rotatePiece(currentlyGrabbed,originPiece);
                for(let o of currentlyGrabbed.neighbors){
                    rotatePiece(pieceMap[o],originPiece);
                }
            }
            return false;
        }

        // tell p5 what to do on mouse press. Pick up a puzzle peice and everything attatched to it.
        p.mousePressed = function() {
            // console.log(p.mouseX, p.mouseY  )
            for(let i = piecesToDraw.length-1;i>=0;i--){
                let [r,g,b,a] = piecesToDraw[i].skin.get(p.mouseX-piecesToDraw[i].x,p.mouseY-piecesToDraw[i].y);
                if(a!=0) {
                    // console.log("grabbed: ", piecesToDraw[i].x, piecesToDraw[i].y)
                    currentlyGrabbed = piecesToDraw[i];
                    // a
        
                    piecesToDraw.splice(i,1);
                    piecesToDraw = piecesToDraw.filter(piece => !currentlyGrabbed.neighbors.includes(piece.id))
                    piecesToDraw.push(currentlyGrabbed,...(currentlyGrabbed.neighbors.map(e => pieceMap[e])));
                    origMouseX = p.mouseX;
                    origMouseY = p.mouseY;
                    currentlyGrabbed.grabbed = true;
                    currentlyGrabbed.originalGrabbedX = currentlyGrabbed.x;
                    currentlyGrabbed.originalGrabbedY = currentlyGrabbed.y;
                    for(let o of currentlyGrabbed.neighbors){
                        pieceMap[o].grabbed = true;
                        pieceMap[o].originalGrabbedX = pieceMap[o].x;
                        pieceMap[o].originalGrabbedY = pieceMap[o].y
                    }
                    return;
                }
            }
        }

        // tell p5 what to do when mouse is dragged. Move all picked up pieces.
        p.mouseDragged = function() {
            // console.log(p.mouseX, p.mouseY)
            if(currentlyGrabbed!=null){
                let dispX = p.mouseX - origMouseX;
                let dispY = p.mouseY - origMouseY;
                currentlyGrabbed.x = currentlyGrabbed.originalGrabbedX + dispX;
                currentlyGrabbed.y = currentlyGrabbed.originalGrabbedY + dispY;
                // console.log(currentlyGrabbed.x, currentlyGrabbed.y)
                for(let o of currentlyGrabbed.neighbors){
                    pieceMap[o].x = pieceMap[o].originalGrabbedX + dispX;
                    pieceMap[o].y = pieceMap[o].originalGrabbedY + dispY;
                }

            }
        }

        // When mouse is released check if any new connections were made, and release the pieces.
        p.mouseReleased = function() {
            if(currentlyGrabbed === null) return;

            // for every grabbed piece
            for(let piece of piecesToDraw){
                if(!piece.grabbed) continue;
                // if the piece is grabbed, check whether it is near enough to snap to one of its fits
                if(fit(piece)){
                    // if the number of pieces connected to this piece is equal to tot. pieces -> user solved the puzzle
                    if(currentlyGrabbed.neighbors.length === (pieceCount[0]*pieceCount[1])-1){
                        continue;
                        // alert("Congragulations on solving the puzzle");
                    }
                    break;
                }
            }
            
            for(let piece of piecesToDraw){
                if(!piece.grabbed) continue;
                piece.grabbed = false;
                piece.originalGrabbedX = null;
                piece.originalGrabbedY = null;
            }
            
            currentlyGrabbed = null;
        }

        /*
        --------------------------------
        The next few functions generatePiece, generateMask, and generatePiece template have the 
        functionality to cut out the pieces from the image.

        The pieces are cut out from the image using the p5 library (https://p5js.org/)

        The p5 library has image masking functionality, so you can create a shape
        programatically and than mask an image to that shape. This is how the puzzle
        pieces are created. The mask is defined by a set of bezier curves which are
        defined by arrays of values in p5. The code in this file is to generate
        those values which can then be used to mask the original image and cut out
        each piece. The code also has logic to make sure adjacent pieces fit into
        each other and that pieces shapes are distorted slightly as to make each puzzle
        unique.
        --------------------------------
        */
        function copyImage(toCopy) {
            let temp = p.createImage(toCopy.width * density , toCopy.height* density );
            temp.copy(toCopy, 0, 0, toCopy.width , toCopy.height , 0, 0, toCopy.width *density, toCopy.height*density);
            return temp;
        }

        // return type myPiece ; this function is to create the actual piece object
        function generatePiece(pieceRow,pieceCol,pieceId) {
        
            let curOrientations = getRandomOrientations();
            if(pieceCol==0) curOrientations[3]=0;
            if(pieceCol==pieceCount[0]-1) curOrientations[1]=0;
            if(pieceRow==0) curOrientations[0]=0;
            if(pieceRow==pieceCount[1]-1) curOrientations[2]=0;
            if(pieceRow>0){
                curOrientations[0] = pieces[pieceRow-1][pieceCol].orientations[2] * -1;
            }
            if(pieceCol>0){
                curOrientations[3] = pieces[pieceRow][pieceCol-1].orientations[1] * -1;
            }
            // generate the piece
            // let tempImage = img.get();
            // img.loadPixels();
            // console.log(img.pixels.length, img);
            // let tempImage = p.createImage(img.width * 2, img.height * 2);
            // tempImage.loadPixels();
            // tempImage.pixels.set(img.pixels);
            // tempImage.updatePixels();

            // console.log(img)
            let tempImage = copyImage(img);
            // let tempImage = p.createImage(img.width * 2, img.height * 2);
            // tempImage.copy(img, 0, 0, img.width, img.height, 0, 0, img.width *2, img.height *2);
            // let tempImage = p.createImage()
            let res = generateMask(pieceRow,pieceCol,curOrientations);
            let pieceMask = res[0];
            let pieceData = res[1];
            tempImage.mask(pieceMask);
            let pieceWithBorder = p.createGraphics(img.width,img.height);
            // console.log("pieceWithBorder", pieceWithBorder.width, pieceWithBorder.height)
            pieceWithBorder.pixelDensity(2);
            pieceWithBorder.clear();
            // pieceWithBorder.image(tempImage,0,0)
            pieceWithBorder.copy(tempImage, 0, 0, tempImage.width, tempImage.height, 0, 0, img.width, img.height)
            pieceWithBorder.noFill();
            pieceWithBorder.strokeWeight(1);
            let pieceBorder = pieceData.template;
            pieceWithBorder.beginShape();
            pieceWithBorder.vertex(pieceData.topLeft[0],pieceData.topLeft[1]);
            for(let arr of pieceBorder){
                pieceWithBorder.bezierVertex(...arr);
            }
            pieceWithBorder.endShape();
            
            let p1 = new myPiece(pieceWithBorder,tempImage,curOrientations,pieceRow,pieceCol,pieceData,pieceId,100,100);
            // let p1 = new myPiece(t,tempImage,curOrientations,pieceRow,pieceCol,pieceData,pieceId,100,100);
            pieceWithBorder.remove();
            pieceWithBorder = null;
            return p1;
        };
        
        // this function returns the mask (an 2d array of ints that p5 expects in a certain way) and an object containing
        // data associated with the piece. This function is called by generatePiece.
        function generateMask(pieceRow,pieceCol,orientations) {

            let pieceMask = p.createGraphics(img.width,img.height);
            // pieceMask.pixelDensity(density);
            pieceMask.clear();
            pieceMask.fill('rgba(0, 0, 0, 1)');
            let pieceData = generatePieceTemplate(pieceRow,pieceCol,orientations);
            let template = pieceData.template;
            pieceMask.beginShape();
            pieceMask.vertex(pieceData.topLeft[0],pieceData.topLeft[1]);
            for(let arr of template){
                pieceMask.bezierVertex(...arr);
            }
            pieceMask.endShape();
            // let res = piece Mask.get()
            let res = pieceMask
            // let res = copyImage(pieceMask)
            pieceMask.remove();
            pieceMask = null;
            return [res,pieceData];
        }
        
        // returns an array of values in a certain format p5 expects to define a shape that an image can be masked to.
        // this function is called by generateMask
        function generatePieceTemplate(pieceRow,pieceCol,orientations){
        
            let width = xDims[pieceCol];
            let height = yDims[pieceRow];
            let topLeftX = prefxDims[pieceCol];
            let topLeftY = prefyDims[pieceRow];
        
            let topOrientation = orientations[0] * -1;
            let rightOrientation = orientations[1];
            let botOrientation = orientations[2];
            let leftOrientation = orientations[3] * -1;
        
        
            let topLeft = [topLeftX,topLeftY];
            let topRight = [topLeftX+width,topLeftY];
            let botRight = [topLeftX+width,topLeftY+height];
            let botLeft = [topLeftX,topLeftY+height];
            let tabHeight = normalize(width,20);
            let tabInset = normalize(width,40);
            let c1 = normalize(width,20);
            let c2 = normalize(width,50);
            let htabHeight = normalize(height,20);
            let htabInset = normalize(height,40);
            let hc1 = normalize(height,20);
            let hc2 = normalize(height,50);
            let r = 1.5;
            let topBridgeStart = [topLeft[0]+(tabInset),topLeft[1]+(tabHeight*topOrientation)];
            let topBridgeEnd = [topRight[0]-(tabInset),topRight[1]+(tabHeight*topOrientation)];
            let rightBridgeStart = [topRight[0]+(htabHeight*rightOrientation),topRight[1]+htabInset];
            let rightBridgeEnd = [botRight[0]+(htabHeight*rightOrientation),botRight[1]-htabInset];
            let botBridgeStart = [botRight[0]-tabInset,botRight[1]+(tabHeight*botOrientation)];
            let botBridgeEnd = [botLeft[0]+tabInset,botLeft[1]+(tabHeight*botOrientation)];
            let leftBridgeStart = [botLeft[0]+(htabHeight*leftOrientation),botLeft[1]-htabInset];
            let leftBridgeEnd = [topLeft[0]+(htabHeight*leftOrientation),topLeft[1]+htabInset];
            let bridgeNudgeDist = normalize(width,5,125);
            let botRightNudgeDist = normalize(width,10,125);
            if(pieceRow != pieceCount[1]-1 && pieceCol!= pieceCount[0]-1){
                nudge(botRight,botRightNudgeDist);
            }
            if(pieceRow!=pieceCount[1]-1){
                nudge(botBridgeStart,bridgeNudgeDist);
                nudge(botBridgeEnd,bridgeNudgeDist);
            }
            if(pieceCol!=pieceCount[0]-1){
                nudge(rightBridgeStart,bridgeNudgeDist);
                nudge(rightBridgeEnd,bridgeNudgeDist);
            }
            if(pieceRow > 0){
                topLeft = pieces[pieceRow-1][pieceCol].data.botLeft;
                topBridgeStart = pieces[pieceRow-1][pieceCol].data.botBridgeEnd;
                topBridgeEnd = pieces[pieceRow-1][pieceCol].data.botBridgeStart;
                topRight = pieces[pieceRow-1][pieceCol].data.botRight;
            }
            if(pieceCol > 0){
                botLeft = pieces[pieceRow][pieceCol-1].data.botRight;
                leftBridgeStart = pieces[pieceRow][pieceCol-1].data.rightBridgeEnd;
                leftBridgeEnd = pieces[pieceRow][pieceCol-1].data.rightBridgeStart;
                topLeft = pieces[pieceRow][pieceCol-1].data.topRight;
        
            }
            let pieceData = {
                width: width,
                height: height,
                topLeft: topLeft,
                topRight: topRight,
                botLeft: botLeft,
                botRight: botRight,
                topOrientation: topOrientation,
                rightOrientation: rightOrientation,
                botOrientation: botOrientation,
                leftOrientation: leftOrientation,
                tabInset: tabInset,
                tabHeight: tabHeight,
                c1: c1,
                c2: c2,
                r: r,
                topBridgeStart: topBridgeStart,
                topBridgeEnd: topBridgeEnd,
                rightBridgeStart: rightBridgeStart,
                rightBridgeEnd: rightBridgeEnd,
                botBridgeStart: botBridgeStart,
                botBridgeEnd: botBridgeEnd,
                leftBridgeStart: leftBridgeStart,
                leftBridgeEnd: leftBridgeEnd,
            }
            let masterTemplate = [
                [topLeft[0]+c1,topLeft[1],topLeft[0]+c2,topLeft[1],...topBridgeStart],
                [...getLine(topLeft[0]+c2,topLeft[1],...topBridgeStart,r),...getLine(topRight[0]-c2,topRight[1],...topBridgeEnd,r),...topBridgeEnd],
                [topRight[0]-c2,topRight[1],topRight[0]-c1,topRight[1],topRight[0],topRight[1]],
        
                [topRight[0],topRight[1]+hc1,topRight[0],topRight[1]+hc2,...rightBridgeStart],
                [...getLine(topRight[0],topRight[1]+hc2,...rightBridgeStart,r),...getLine(botRight[0],botRight[1]-hc2,...rightBridgeEnd,r) ,...rightBridgeEnd],
                [botRight[0],botRight[1]-hc2,botRight[0],botRight[1]-hc1,botRight[0],botRight[1]],
        
                [botRight[0]-c1,botRight[1],botRight[0]-c2,botRight[1],...botBridgeStart],
                [...getLine(botRight[0]-c2,botRight[1],...botBridgeStart,r),...getLine(botLeft[0]+c2,botLeft[1],...botBridgeEnd,r),...botBridgeEnd],
                [botLeft[0]+c2,botLeft[1],botLeft[0]+c1,botLeft[1],botLeft[0],botLeft[1]],
        
                [botLeft[0],botLeft[1]-hc1,botLeft[0],botLeft[1]-hc2,...leftBridgeStart],
                [...getLine(botLeft[0],botLeft[1]-hc2,...leftBridgeStart,r),...getLine(topLeft[0],topLeft[1]+hc2,...leftBridgeEnd,r),...leftBridgeEnd],
                [topLeft[0],topLeft[1]+hc2,topLeft[0],topLeft[1]+hc1,topLeft[0],topLeft[1]]
            ];
            pieceData.template = masterTemplate;
            return pieceData;
        }

        // this function rotates the actual image of a piece so that it displays rotated to the user.
        // It also has logic that is used to rotate multiples pieces in a group of attatched pieces at once.
        function rotatePiece(piece,originPiece=piece){
        
            let rdim = Math.max(piece.skin.height,piece.skin.width);
            let rotater = p.createGraphics(rdim*2,rdim*2);
            rotater.clear();
            rotater.translate(rotater.width/2,rotater.height/2);
            rotater.rotate(Math.PI/2);
            rotater.image(piece.skin,0,0);
            // let rotated = rotater.get();
            // let rotated = copyImage(rotater);

            // rotater.remove();
            // rotater=null;
        
            let newSkin = p.createGraphics(piece.skin.width,piece.skin.height);
            newSkin.clear();
            newSkin.imageMode(p.CENTER);
            // newSkin.image(rotated,piece.data.cellCenter[0]+piece.data.cellCenter[1],piece.data.cellCenter[1]-piece.data.cellCenter[0])
            newSkin.image(rotater,piece.data.cellCenter[0]+piece.data.cellCenter[1],piece.data.cellCenter[1]-piece.data.cellCenter[0])
            let piecew = piece.data.topRight[0] - piece.data.topLeft[0];
            let pieceh = piece.data.botRight[1] - piece.data.topRight[1];
            // console.log(piece.skin.width, piece.skin.height)
            // console.log(piecew, pieceh);
            // newSkin.copy(rotater, 0, 0, rotated.width, rotated.height, 0, 0, newSkin.width, newSkin.height)
            // let newskin = newSkin.get();
            piece.skin = newSkin;
            // let newskin = copyImage(newSkin);
            
            rotater.remove();
            rotater=null;
            newSkin.remove();
            newSkin=null;
            piece.data.topLeft = rotate90ccw(piece.data.topLeft,piece.data.cellCenter);
            piece.data.topRight = rotate90ccw(piece.data.topRight,piece.data.cellCenter);
            piece.data.botLeft = rotate90ccw(piece.data.botLeft,piece.data.cellCenter);
            piece.data.botRight = rotate90ccw(piece.data.botRight,piece.data.cellCenter);
            // piece.skin = newskin;

            let originOfRotation = [originPiece.x + originPiece.data.cellCenter[0],originPiece.y + originPiece.data.cellCenter[1]];
            let pieceCenter = [piece.x + piece.data.cellCenter[0],piece.y + piece.data.cellCenter[1]];
            let rotatedCenter = rotate90ccw(pieceCenter,originOfRotation);
            [piece.x,piece.y] = [rotatedCenter[0] - piece.data.cellCenter[0],rotatedCenter[1] - piece.data.cellCenter[1]];
            origMouseX = p.mouseX;
            origMouseY = p.mouseY;
            [piece.originalGrabbedX,piece.originalGrabbedY] = [piece.x,piece.y];

        }
    }
    return sketch;
}
export default sketchGenerator;