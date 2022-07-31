import React, {useContext, useEffect} from 'react'
import { PuzzleDataContext } from '../contexts/puzzleData';

function Puzzle() {
    const PuzzleData = useContext(PuzzleDataContext);
    
    useEffect(()=> {
        console.log(PuzzleData)
    }, [])
    return (
        <div>Puzzle</div>
    )
}

export default Puzzle