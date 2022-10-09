import React, { useEffect, useState, useContext } from 'react'
import { PuzzleDataContext } from '../contexts/puzzleData';
import LoadingSpinner from './LoadingSpinner'
import PuzzleImage from './PuzzleImage'

function WelcomeScreen() {
    
    return (
        <div className="bg-black w-full h-full text-white">
            <PuzzleImage />
        </div>
    )
}

export default WelcomeScreen