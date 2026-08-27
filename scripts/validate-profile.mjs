import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedDirectory = path.join(root, "assets", "generated");
const expectedAssets = [
  "banner-dark.svg",
  "banner-light.svg",
  "stack-dark.svg",
  "stack-light.svg",
  "metrics-dark.svg",
  "metrics-light.svg",
  "footer-dark.svg",
  "footer-light.svg"
];

const errors = [];
for (const asset of expectedAssets) {
  const assetPath = path.join(generatedDirectory, asset);
  try {
    await access(assetPath);
    const source = await readFile(assetPath, "utf8");
    const metadata = await stat(assetPath);
    if (!source.startsWith("<svg")) errors.push(`${asset}: missing SVG root`);
    if (!source.includes("viewBox=")) errors.push(`${asset}: missing viewBox`);
    if (!source.includes("<title")) errors.push(`${asset}: missing title`);
    if (!source.includes("<desc")) errors.push(`${asset}: missing description`);
    if (/<script\b/i.test(source)) errors.push(`${asset}: scripts are not allowed`);
    const sourceWithoutSvgNamespace = source.replace('xmlns="http://www.w3.org/2000/svg"', "");
    if (/https?:\/\//i.test(sourceWithoutSvgNamespace)) errors.push(`${asset}: unexpected external URL`);
    if (metadata.size > 250_000) errors.push(`${asset}: larger than 250 KB`);
  } catch {
    errors.push(`${asset}: file not found`);
  }
}

const readme = await readFile(path.join(root, "README.md"), "utf8");
for (const asset of expectedAssets) {
  if (!readme.includes(`./assets/generated/${asset}`)) {
    errors.push(`README.md: ${asset} is not referenced`);
  }
}
if (/<\/br\s*>/i.test(readme)) errors.push("README.md: invalid closing br tag");
if (/target="_blank"/i.test(readme)) errors.push("README.md: unnecessary target attribute");

if (errors.length > 0) {
  console.error(`Profile validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Profile validation passed (${expectedAssets.length} SVG assets checked)`);
