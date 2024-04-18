import { defineConfig } from 'tsup'

export default defineConfig((options) =>({
    entryPoints: ['src/index.tsx'],
    format: ['cjs', 'esm'],
    minify: "terser",
    terserOptions: {
        compress: {
            arrows: true,
            unsafe: true,
            module: true,
            passes: 3,
            toplevel: true,
            ecma: 2020
        },
        mangle: {
            toplevel: true,
            reserved: ['useDebugValue'],
            properties: {
                regex: /_$/
            }
        },
    },
    dts: true,
    outDir: 'dist',
    clean: true,
    sourcemap: true,
    
}))