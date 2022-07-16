import React, { useEffect, useState } from 'react'
import LoadingSpinner from './LoadingSpinner'
import PuzzleImage from './PuzzleImage'

const ENDPOINT = "https://api.artic.edu/api/v1/artworks"
function WelcomeScreen() {
    const [imageData, setImageData] = useState(null);
    const [loading, setLoading] = useState(false);

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
    useEffect(() => {
        fetchImage();
    },[])
    
    return (
        <div className="bg-black w-full h-full text-white">
            <PuzzleImage data={imageData} loading={loading}/>
            
            <div className="w-full h-[10%] text-center">
                <button className="text-white" onClick={fetchImage}>
                    Load New
                </button>
            </div>
        </div>
    )
}

export default WelcomeScreen