import { BrowserRouter, Route, Routes } from "react-router-dom";
import Puzzle from "./components/Puzzle";
import WelcomeScreen from "./components/WelcomeScreen";


function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route exact path="/" element={<WelcomeScreen/>}/>
          <Route exact path="/game" element={<Puzzle/>}/>
        </Routes>
      </BrowserRouter>
  );
}

export default App;
