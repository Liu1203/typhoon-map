import { defineConfig } from "vite"
import uniPlugin from "@dcloudio/vite-plugin-uni"

const uni = (uniPlugin as any).default || uniPlugin

export default defineConfig({
  plugins: [uni()],
})
