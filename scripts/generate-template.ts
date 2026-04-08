import { buildGtmTemplateFileSource } from "@getuserfeedback/adapters/gtm";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const templatePath = path.resolve("template.tpl");
const templateTestsPath = path.resolve("template-tests.yaml");
const brandThumbnailPath = path.resolve("template-source", "brand-thumbnail.txt");

const readBrandThumbnail = (): string => readFileSync(brandThumbnailPath, "utf8").trim();

const readTemplateTests = (): string => readFileSync(templateTestsPath, "utf8").trim();

const generatedTemplate = buildGtmTemplateFileSource({
  infoOverrides: {
    brandThumbnail: readBrandThumbnail(),
  },
  tests: readTemplateTests(),
});

writeFileSync(templatePath, generatedTemplate, "utf8");

console.log(`Wrote ${path.basename(templatePath)}`);
