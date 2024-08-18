import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { RecoilRoot } from "recoil";
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId="78307300358-bdvig20go0bsno04h5r5sgqjfetcc21u.apps.googleusercontent.com">
    <React.StrictMode>
      <BrowserRouter>
        <ChakraProvider>
          <RecoilRoot>
            <App />
          </RecoilRoot>
        </ChakraProvider>
      </BrowserRouter>
    </React.StrictMode>
  </GoogleOAuthProvider>
);
