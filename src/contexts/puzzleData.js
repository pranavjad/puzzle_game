import React from 'react';

export const puzzleData = {
    url: "",
    width: 0,
    height: 0,
    pieceCount: 0,
    setUrl: (u)=>{},
    setWidth: (w)=>{},
    setHeight: (h)=>{},
    setPieceCount: (p)=>{}
}
export const PuzzleDataContext = React.createContext(puzzleData);