import { writeFileSync } from "node:fs";
import path from "node:path";
import { buildCurrentTemplateFileSource } from "./render-template";

const templatePath = path.resolve("template.tpl");
const generatedTemplate = buildCurrentTemplateFileSource();

writeFileSync(templatePath, generatedTemplate, "utf8");

console.log(`Wrote ${path.basename(templatePath)}`);
