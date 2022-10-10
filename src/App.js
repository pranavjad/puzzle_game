import { BrowserRouter, Route, Routes } from "react-router-dom";
import Puzzle from "./components/Puzzle";
import Puzzle1 from "./components/Puzzle1";
import WelcomeScreen from "./components/WelcomeScreen";
import {puzzleData, PuzzleDataContext} from "./contexts/puzzleData"
import { useState } from "react";

function App() {
  const [url, setUrl] = useState("")
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [pieceCount, setPieceCount] = useState(0)
  return (
    <PuzzleDataContext.Provider value={{
      url, width, height, pieceCount, setUrl, setWidth, setHeight, setPieceCount
    }}>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Routes>
          <Route exact path="/" element={<WelcomeScreen/>}/>
          <Route exact path="/game" element={<Puzzle1/>}/>
        </Routes>
      </BrowserRouter>
    </PuzzleDataContext.Provider>
  );
}

export default App;
