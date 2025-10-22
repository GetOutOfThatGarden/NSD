import { createRoot } from 'react-dom/client';
import { SolanaProvider } from './solana/SolanaProvider';
import { Home } from './routes/home';
import { Docs } from './routes/docs';
import { Header } from './components/Header';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import './app.css';

const App = () => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <main>
      <Outlet />
    </main>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'docs',
        element: <Docs />,
      },
    ],
  },
]);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <SolanaProvider>
    <RouterProvider router={router} />
  </SolanaProvider>
);