import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "./context/index.jsx";
import { AppRouter } from "./router/AppRouter.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </BrowserRouter>
  );
}
