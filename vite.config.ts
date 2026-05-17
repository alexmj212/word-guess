import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/word-guess/",
  define: {
    __BUILD_VERSION__: JSON.stringify(
      process.env.REACT_APP_VERSION || "dev"
    ),
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [".claude/**", "node_modules/**"],
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
  },
});
