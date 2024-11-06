Write-Output "=> Starting build process..."
Write-Output "------------------- Building middlewares... -------------------"
tsup src/middlewares/index.ts --format "esm,cjs" --dts --out-dir dist/middlewares
Write-Output "------------------- middlewares have been built successfully! -------------------"

Write-Output "------------------- Building managers... -------------------"
tsup src/managers/index.ts --format "esm,cjs" --dts --out-dir dist/managers
Write-Output "------------------- managers have been built successfully! -------------------"

Write-Output "------------------- Building helpers... -------------------"
tsup src/helpers/index.ts --format "esm,cjs" --dts --out-dir dist/helpers
Write-Output "------------------- Helpers have been built successfully! -------------------"

Write-Output "------------------- Building types... -------------------"
tsup src/types/index.ts --format "esm,cjs" --dts --out-dir dist/types
Write-Output "------------------- Types have been built successfully! -------------------"

Write-Output "------------------- Building Test... -------------------"
tsup src/test.ts --format "esm,cjs" --dts --out-dir dist
Write-Output "------------------- Test have been built successfully! -------------------"

Write-Output "=> Build process successfully completed!"
