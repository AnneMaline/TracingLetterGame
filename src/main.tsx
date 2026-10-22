import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { readLaunchParams } from "./modules/container/launchParams";
import { loadLanguageContent } from "./modules/container/loadLanguageContent";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found in index.html");
}

const root = createRoot(container);
const { lang } = readLaunchParams();

loadLanguageContent(lang).then(
  (content) => {
    root.render(
      <StrictMode>
        <App content={content} />
      </StrictMode>,
    );
  },
  (error: unknown) => {
    console.error(`Failed to load language pack "${lang}"`, error);
    root.render(
      <p style={{ padding: "2rem", textAlign: "center" }} role="alert">
        The letters for this language could not be loaded.
      </p>,
    );
  },
);
