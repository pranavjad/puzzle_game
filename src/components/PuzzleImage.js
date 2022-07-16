import React from 'react'
import LoadingSpinner from './LoadingSpinner'

function PuzzleImage({data, loading}) {
    const showImage = () => {
        if(!data || loading){
            return <LoadingSpinner className="absolute top:0" />
        }

        return <div
            
            className={`relative h-3/4 hover:bg-black`}
        >
            <img 
                src={`https://www.artic.edu/iiif/2/${data.image_id}/full/843,/0/default.jpg`}
                // className="h-full hover:scale-110 duration-300"
                className="h-full"
            />
            <div className="opacity-0 hover:opacity-100  duration-300">
                <div className="absolute top-0 left-0 h-full w-full bg-slate-300 opacity-80"></div>
                <p 
                    style={{backgroundImage: (`linear-gradient( rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3) ), url('https://www.artic.edu/iiif/2/${data.image_id}/full/843,/0/default.jpg')`)}}
                    className={`flex w-full h-full absolute bottom-0 left-0 font-black text-2xl justify-center items-center bg-clip-text text-transparent bg-cover text-center p-5`}

                >
                    {data.title? data.title : "unknown title"} <br/><br/>
                    {data.artist_title? data.artist_title : "unknown artist"} <br/>
                    {data.date_start? `${Math.abs(data.date_start)} ${data.date_start<0?"BCE":""}` : "unknown date"}
                </p>
            </div>
        </div>
    }
    // const showArtData = () => {
    //     if(!loading && data) return 
    // }
    return (
        <div className="w-full h-[90%]">
            <div className="h-full flex flex-row justify-center items-center">
                {showImage()}
                {/* {showArtData()} */}
            </div>
            
        </div>
    )
}

export default PuzzleImage