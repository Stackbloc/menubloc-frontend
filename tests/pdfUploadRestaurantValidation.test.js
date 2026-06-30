import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/pages/PdfUploadPage.jsx", import.meta.url), "utf8");

assert.match(source, /\/menu-upload\/restaurant\/validate/);
assert.match(source, /restaurantValidation\.status !== "valid"/);
assert.match(source, /Restaurant record could not be found for ID/);
assert.match(source, /role="alert">\{restaurantValidation\.error\}/);

console.log("PDF upload restaurant validation contract passed");
