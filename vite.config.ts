import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const apiProxyTarget = env.VITE_API_PROXY_TARGET;

    return {
        plugins: [react(), tailwindcss()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        server: {
            proxy: apiProxyTarget
                ? {
                      "/api": {
                          target: apiProxyTarget,
                          changeOrigin: true,
                          secure: true,
                          rewrite: (requestPath) => requestPath.replace(/^\/api/, ""),
                      },
                  }
                : undefined,
        },
    };
});
