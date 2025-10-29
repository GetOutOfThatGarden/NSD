import { WalletProvider } from './components/WalletProvider'
import { BasaltCDP } from './components/BasaltCDP'
import './App.css'

function App() {
  return (
    <WalletProvider>
      <div className="App">
        <header className="App-header">
          <h1>Basalt CDP Tech Demo</h1>
          <p>Deposit SPYx collateral and mint USDrw stablecoin on Solana Devnet</p>
        </header>
        <main>
          <BasaltCDP />
        </main>
      </div>
    </WalletProvider>
  )
}

export default App
