import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "./context/index.jsx";
import { AppRouter } from "./router/AppRouter.jsx";
import { ScrollRestoration } from "./router/ScrollRestoration.jsx";

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <ScrollRestoration />
        <AppRouter />
      </BrowserRouter>
    </AppProviders>
  );
}
