import React, { useEffect, useState, useContext } from 'react'
import { PuzzleDataContext } from '../contexts/puzzleData';
import LoadingSpinner from './LoadingSpinner'
import PuzzleImage from './PuzzleImage'

const ENDPOINT = "https://api.artic.edu/api/v1/artworks"
function WelcomeScreen() {
    const [imageData, setImageData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pieceCount, setPieceCount] = useState(0);
    const PuzzleData = useContext(PuzzleDataContext);
    const handleSliderChange = (e) => {
        setPieceCount(e.target.value)
    }
    const fetchImage = async () => {
        setLoading(true);
        // Chose a random page from the API [0,400) and a random index on that page [0,12)
        let randomPage = Math.floor(Math.random()*400);
        let randomIndex = Math.floor(Math.random()*12);

        let url = ENDPOINT+`?page=${randomPage}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        console.log(randomPage);
        console.log(data.data[randomIndex])
        setImageData(data.data[randomIndex]);
        setLoading(false);
    }
    const startPuzzle = (imgUrl, w, h, pieceCnt) => {
        PuzzleData.url = imgUrl;
        PuzzleData.width = w;
        PuzzleData.height = h;
        PuzzleData.pieceCount = pieceCnt;
    }
    useEffect(() => {
        fetchImage();
    },[])
    return (
        <div className="bg-black w-full h-full text-white">
            <PuzzleImage data={imageData} loading={loading} pieceCount={pieceCount}/>
            <div className="w-full h-[10%] text-center flex items-center justify-center gap-4">
                <button className="text-white" onClick={fetchImage}>
                    Load New
                </button>
                <input type="range" min="0" max="100" onChange={handleSliderChange} value={pieceCount} />
            </div>
        </div>
    )
}

export default WelcomeScreen