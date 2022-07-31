import React, {useState, useContext, useRef} from 'react'
import { Link } from 'react-router-dom';
import { PuzzleDataContext } from '../contexts/puzzleData';
import LoadingSpinner from './LoadingSpinner'

function PuzzleImage({data, loading, pieceCount}) {
    const PuzzleData = useContext(PuzzleDataContext);
    const imgRef = useRef(null);
    const [imgHeight, setImgHeight] = useState(0);
    const [imgWidth, setImgWidth] = useState(0);

    const imgLoaded = () => {
        console.log(imgRef.current.clientWidth, imgRef.current.clientHeight);
        setImgHeight(imgRef.clientWidth);
        setImgWidth(imgRef.clientHeight);
    }
    const startPuzzle = () => {
        PuzzleData.url = `https://www.artic.edu/iiif/2/${data.image_id}/full/843,/0/default.jpg`;
        PuzzleData.width = imgRef.current.clientWidth;
        PuzzleData.height = imgRef.current.clientHeight;
        PuzzleData.pieceCount = pieceCount;
    }

    const showImage = () => {
        if(!data || loading){
            return <LoadingSpinner className="absolute top:0" />
        }
        return <div
            
            className={`relative h-3/4`}
        >
            <img 
                src={`https://www.artic.edu/iiif/2/${data.image_id}/full/843,/0/default.jpg`}
                className="h-full"
                ref={imgRef}
                onLoad={imgLoaded}
            />
            <div className="border h-[60px] skew-x-[45deg] relative left-[30px]">
                <p className="m-3 text-2xl uppercase font-bold tracking-wide">
                    Browser Puzzle
                </p>
            </div>
            <div className="border absolute top-[30px] right-0 mr-[-60px] h-full w-[60px] skew-y-[45deg] ">
                <p className="transform text-2xl origin-top-left rotate-[-90deg] absolute top-[50%] left-[25%] w-[200px]">
                    {pieceCount} pieces
                </p>
                <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 50 50" style={{enableBackground:"new 0 0 50 50"}} xmlSpace="preserve" className="rotate-[-90deg] scale-75">
                    <g id="Layer_1" fill="white">
                        <path d="M43,24c-0.688,0-1.361,0.119-2,0.351V9H26.649C26.881,8.361,27,7.688,27,7c0-3.309-2.691-6-6-6s-6,2.691-6,6   c0,0.688,0.119,1.361,0.351,2H1v19.031l1.603-1.21C3.313,26.284,4.143,26,5,26c2.206,0,4,1.794,4,4s-1.794,4-4,4   c-0.857,0-1.687-0.284-2.397-0.82L1,31.969V49h40V35.649C41.639,35.881,42.312,36,43,36c3.309,0,6-2.691,6-6S46.309,24,43,24z    M43,34c-0.857,0-1.687-0.284-2.397-0.82L39,31.969V47H3V35.649C3.639,35.881,4.312,36,5,36c3.309,0,6-2.691,6-6s-2.691-6-6-6   c-0.688,0-1.361,0.119-2,0.351V11h16.031L17.82,9.397C17.284,8.687,17,7.857,17,7c0-2.206,1.794-4,4-4s4,1.794,4,4   c0,0.857-0.284,1.687-0.82,2.397L22.969,11H39v17.031l1.603-1.21C41.313,26.284,42.143,26,43,26c2.206,0,4,1.794,4,4   S45.206,34,43,34z"/>
                    </g>
                    <g>
                    </g>
                </svg>
            </div>
            <Link to="/game" >
                <button className="opacity-0 hover:opacity-100 duration-300" onClick={startPuzzle}>
                    <div className="absolute top-0 left-0 h-full w-full bg-slate-300 opacity-80"></div>
                    <p 
                        style={{backgroundImage: (`linear-gradient( rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3) ), url('https://www.artic.edu/iiif/2/${data.image_id}/full/843,/0/default.jpg')`)}}
                        className={`flex w-full h-full absolute bottom-0 left-0 font-black text-2xl justify-center items-center bg-clip-text text-transparent bg-cover text-center p-5`}

                    >
                        {data.title? data.title : "unknown title"} <br/><br/>
                        {data.artist_title? data.artist_title : "unknown artist"} <br/>
                        {data.date_start? `${Math.abs(data.date_start)} ${data.date_start<0?"BCE":""}` : "unknown date"}
                    </p>
                </button>
            </Link>
        </div>
    }

    return (
        <div className="w-full h-[90%]">
            <div className="h-full flex flex-row justify-center items-center">
                {showImage()}
            </div>
            
        </div>
    )
}

export default PuzzleImage