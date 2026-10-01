import { buildGtmTemplateFileSource } from "@getuserfeedback/adapters/gtm";
import { readFileSync } from "node:fs";
import path from "node:path";

const templateTestsPath = path.resolve("template-tests.yaml");
const brandThumbnailPath = path.resolve("template-source", "brand-thumbnail.txt");

const readBrandThumbnail = (): string => readFileSync(brandThumbnailPath, "utf8").trim();

const readTemplateTests = (): string => readFileSync(templateTestsPath, "utf8").trim();

export const buildCurrentTemplateFileSource = (): string =>
  buildGtmTemplateFileSource({
    infoOverrides: {
      brandThumbnail: readBrandThumbnail(),
    },
    runtimeEndpoints: {
      apiUrl: "https://widget.getuserfeedback.com/v1",
      coreUrl: "https://cdn.getuserfeedback.com/widget/core/v1/core.html",
    },
    tests: readTemplateTests(),
  });
