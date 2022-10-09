import React, {useContext, useEffect, useRef} from 'react'
import { PuzzleDataContext } from '../contexts/puzzleData';
import exposed from '../utils/test';
import sketch from '../utils/puzzleEngine';
function Puzzle() {
    const PuzzleData = useContext(PuzzleDataContext);
    const canvasRef = useRef(null);
    useEffect(()=> {
        exposed();
        console.log("run")
        console.log(PuzzleData);
        let canvas = canvasRef.current;
        let ctx = canvas.getContext('2d');
        const scale = window.devicePixelRatio;
        console.log(scale);
        let canvasWidth = window.innerWidth - 1;
        let canvasHeight = window.innerHeight - 1;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height =  `${canvasHeight}px`;
        // canvas.width = Math.floor(document.documentElement.clientWidth * scale);
        // canvas.height = Math.floor(document.documentElement.clientHeight * scale);
        canvas.width = Math.floor(canvasWidth * scale);
        canvas.height = Math.floor(canvasHeight * scale);
        ctx.scale(scale, scale);

        let cimg = new Image();
        cimg.src = PuzzleData.url;
        // function drawShape(ctx, xoff, yoff) {
        //     ctx.beginPath();
        //     ctx.moveTo(132 + xoff, 63 + yoff);
        //     ctx.bezierCurveTo(210 + xoff, 33 + yoff, 255 + xoff, 39 + yoff, 241 + xoff, 69 + yoff);
        //     ctx.bezierCurveTo(191 + xoff, 176 + yoff, 368 + xoff, 178 + yoff, 311 + xoff, 72 + yoff);
        //     ctx.bezierCurveTo(295 + xoff, 42 + yoff, 342 + xoff, 37 + yoff, 420 + xoff, 64 + yoff);
        //     ctx.bezierCurveTo(421 + xoff, 64 + yoff, 393 + xoff, 196 + yoff, 431 + xoff, 177 + yoff);
        //     ctx.bezierCurveTo(561 + xoff, 114 + yoff, 546 + xoff, 310 + yoff, 433 + xoff, 244 + yoff);
        //     ctx.bezierCurveTo(393 + xoff, 221 + yoff, 426 + xoff, 364 + yoff, 425 + xoff, 364 + yoff);
        //     ctx.bezierCurveTo(347 + xoff, 389 + yoff, 292 + xoff, 383 + yoff, 307 + xoff, 354 + yoff);
        //     ctx.bezierCurveTo(367 + xoff, 237 + yoff, 185 + xoff, 237 + yoff, 244 + xoff, 354 + yoff);
        //     ctx.bezierCurveTo(263 + xoff, 391 + yoff, 178 + xoff, 379 + yoff, 125 + xoff, 366 + yoff);
        //     ctx.bezierCurveTo(124 + xoff, 366 + yoff, 160 + xoff, 222 + yoff, 115 + xoff, 245 + yoff);
        //     ctx.bezierCurveTo(1 + xoff, 304 + yoff, -3 + xoff, 114 + yoff, 109 + xoff, 177 + yoff);
        //     ctx.bezierCurveTo(160, 177, 109, 177, 132, 63);
        //     ctx.stroke();
        // }
        // function getHandleLocation(x, y) {
        //     x1 = x + 119
        //     y1 = y - 44
        // }
        function drawShape(ctx, xoff, yoff) {
            ctx.beginPath();
            let start = {
                x: 131, y: 64
            }
            ctx.moveTo(start.x + xoff, start.y + yoff); // start
            ctx.bezierCurveTo(start.x + 119 + xoff, start.y - 44 + yoff, 251 + xoff, 59 + yoff, 243 + xoff, 71 + yoff); // inner 1
            ctx.bezierCurveTo(181 + xoff, 174 + yoff, 370 + xoff, 178 + yoff, 310 + xoff, 71 + yoff); // inner 2
            ctx.bezierCurveTo(302 + xoff, 54 + yoff, 303 + xoff, 24 + yoff, 421 + xoff, 64 + yoff); // end
            ctx.stroke();
        }
        cimg.onload = () => {
            console.log(cimg);
            drawShape(ctx, 0, 0);
            // ctx.drawImage(cimg, 0, 0, PuzzleData.width, PuzzleData.height)
        }
        
    }, [])
    return (
        <canvas 
            className="border"
            ref={canvasRef}
        >
            
        </canvas>
    )
}

export default Puzzle