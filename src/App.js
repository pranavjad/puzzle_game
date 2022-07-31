import { BrowserRouter, Route, Routes } from "react-router-dom";
import Puzzle from "./components/Puzzle";
import WelcomeScreen from "./components/WelcomeScreen";
import {puzzleData, PuzzleDataContext} from "./contexts/puzzleData"

function App() {
  return (
    <PuzzleDataContext.Provider value={puzzleData}>
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<WelcomeScreen/>}/>
          <Route exact path="/game" element={<Puzzle/>}/>
        </Routes>
      </BrowserRouter>
    </PuzzleDataContext.Provider>
  );
}

export default App;
