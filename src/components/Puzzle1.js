import React, {useRef, useEffect, useContext, useState} from 'react'
import { PuzzleDataContext } from '../contexts/puzzleData'
import sketchGenerator from '../utils/puzzleEngine'
import { useNavigate } from "react-router-dom";
import p5 from 'p5';
import LoadingSpinner from './LoadingSpinner'
import HelpButton from './HelpButton';
import {AiOutlineQuestionCircle} from 'react-icons/ai'

function Puzzle1() {
    const p5ContainerRef = useRef();
    const PuzzleData = useContext(PuzzleDataContext);
    const [refImgVisible, setRefImgVisible] = useState(false);
    const [showHelp, setshowHelp] = useState(false);
    let navigate = useNavigate();
    const keyDownHandler = (e) => {
        if(e.key == " ") {
            setRefImgVisible(old => {
                return (!old)
            })
            console.log("down")

        }
    }
    useEffect(()=> {
        console.log(PuzzleData)
        if(PuzzleData.url === "" || PuzzleData.url.includes("null")) {
            navigate("/")
        }
        const p5Instance = new p5(sketchGenerator(PuzzleData.url, parseInt(PuzzleData.width), parseInt(PuzzleData.height), parseInt(PuzzleData.pieceCount)), p5ContainerRef.current)
        window.addEventListener("keydown", keyDownHandler)
        // window.addEventListener("keyup", keyUpHandler)
        return () => {
            p5Instance.remove()
            window.removeEventListener("keydown", keyDownHandler)
            // window.removeEventListener("keyup", keyUpHandler)
        }
    }, [])
    return (
        <div className="overflow-hidden h-full w-full bg-black">
            {/* <HelpButton className='fixed top-0 right-0' /> */}
            <div className="h-full w-full relative" ref={p5ContainerRef}>
                {showHelp && 
                    <div className="text-white absolute top-5 right-10">
                        Press 'a' to rotate pieces <br></br>
                        Press spacebar to show reference
                    </div>
                }
                <img className='absolute' style={{display: refImgVisible?"block":"none"}}  src={PuzzleData.url} width={PuzzleData.width} height={PuzzleData.height} />
                {/* <div className="overflow-hidden h-full w-full flex justify-center items-center" ref={p5ContainerRef}>  */}
                {/* <LoadingSpinner classname="absolute"/> */}
                <AiOutlineQuestionCircle className='absolute text-white top-5 right-5 text-xl hover:cursor-help' onMouseEnter={()=>{setshowHelp(true)}} onMouseLeave={()=>{setshowHelp(false)}}/>
            </div>
        </div>
        
    )
}

export default Puzzle1