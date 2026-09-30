import { Calculator } from "./calculator/Calculator";

function App() {
  return (
    <>
      <header className="app-header">
        <img className="app-header__logo" src="/favicon.svg" alt="" />
        <h1 className="app-header__title">Calculuzz</h1>
      </header>

      <main className="app">
        <Calculator />
      </main>
    </>
  );
}

export default App;
