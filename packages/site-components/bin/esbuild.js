const postcssPlugin = require('./postcss-with-esbuild');
const postcssPresetEnv = require('postcss-preset-env');
const autoprefixer = require('autoprefixer');
const fs = require('fs/promises');
const path = require('path');
const esbuild = require('esbuild');

async function handleAssets() {
  await fs.copyFile(
    path.join(__dirname, '../components/style/highlight.scss'),
    path.join(__dirname, '../dist/highlight.scss'),
  );
  await fs.copyFile(
    path.join(__dirname, '../dist/style/index.css'),
    path.join(__dirname, '../dist/bundle.min.css'),
  );
  await fs.rm(path.join(__dirname, '../dist/style/index.css'));
  await fs.rm(path.join(__dirname, '../dist/style/index.js'));
  await fs.rmdir(path.join(__dirname, '../dist/style'));
}


function buildEsm() {
    esbuild
        .build({
            entryPoints: [
                path.join(__dirname, '../components/index.ts'),
                path.join(__dirname, '../components/style/index.ts'),
            ],
            bundle: true,
            outdir: path.join(__dirname, '../dist'),
            format: 'esm',
            minify: process.env.NODE_ENV !== 'development',
            watch:
                process.env.NODE_ENV === 'development'
                    ? {
                        onRebuild(error, result) {
                            if (error) console.error('watch build failed:', error);
                            else console.log('watch build 成功:', result);
                        },
                    }
                    : false,
            external: ['react', 'react-dom'],
            plugins: [
                postcssPlugin({
                    plugins: [autoprefixer, postcssPresetEnv],
                }),
            ],
        }).then(() => {
        console.log('building...');
        handleAssets()
    }).catch(() => process.exit(1));
}

buildEsm()
