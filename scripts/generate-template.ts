import {
  buildGtmTemplateArtifact,
  type GtmTemplateArtifact,
} from "@getuserfeedback/adapters/gtm";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type LegacyBrand = {
  displayName?: string;
  thumbnail?: string;
};

type LegacyTemplateInfo = {
  id?: string;
  securityGroups?: unknown;
  displayName?: string;
  categories?: unknown;
  brandDisplayName?: string;
  description?: string;
};

const templatePath = path.resolve("template.tpl");
const packageJsonPath = path.resolve("package.json");
const templateTestsPath = path.resolve("template-tests.yaml");
const templateSourceDirPath = path.resolve("template-source");
const termsOfServicePath = path.join(templateSourceDirPath, "terms-of-service.txt");
const infoOverridesPath = path.join(templateSourceDirPath, "info-overrides.json");
const brandThumbnailPath = path.join(templateSourceDirPath, "brand-thumbnail.txt");
const UTF8_BOM = "\uFEFF";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readTermsOfService = (): string => readFileSync(termsOfServicePath, "utf8").trim();

const readBrandThumbnail = (): string => readFileSync(brandThumbnailPath, "utf8").trim();

const readInfoOverrides = (): LegacyTemplateInfo => {
  const parsedInfo = JSON.parse(readFileSync(infoOverridesPath, "utf8")) as unknown;

  if (!isRecord(parsedInfo)) {
    throw new Error("Template info overrides must be a JSON object");
  }

  return parsedInfo;
};

const readAdaptersVersion = (): string => {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
  };

  return packageJson.dependencies?.["@getuserfeedback/adapters"] ?? "unknown";
};

const buildMergedInfo = (
  artifact: GtmTemplateArtifact,
  legacyInfo: LegacyTemplateInfo,
): Record<string, unknown> => {
  const brand: LegacyBrand = {
    displayName:
      typeof legacyInfo.brandDisplayName === "string"
        ? legacyInfo.brandDisplayName
        : "getuserfeedback.com",
    thumbnail: readBrandThumbnail(),
  };

  return {
    type: artifact.info.type,
    id: legacyInfo.id ?? "cvt_temp_public_id",
    version: artifact.info.version,
    securityGroups: Array.isArray(legacyInfo.securityGroups) ? legacyInfo.securityGroups : [],
    displayName:
      typeof legacyInfo.displayName === "string"
        ? legacyInfo.displayName
        : artifact.info.displayName,
    categories: Array.isArray(legacyInfo.categories)
      ? legacyInfo.categories
      : artifact.info.categories,
    brand: brand,
    description:
      typeof legacyInfo.description === "string"
        ? legacyInfo.description
        : artifact.info.description,
    containerContexts: artifact.info.containerContexts,
  };
};

const buildNotes = (): string => {
  const timestamp = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "short",
    timeStyle: "medium",
    hour12: false,
  }).format(new Date());
  const adaptersVersion = readAdaptersVersion();
  const generatedNotes = [
    `Generated on ${timestamp} from @getuserfeedback/adapters ${adaptersVersion}.`,
    "Local repo-owned sections are generated from template-source files: terms of service, public template id, security groups, gallery copy, categories, and brand thumbnail.",
    "Embedded GTM tests are maintained in template-tests.yaml.",
  ];

  return generatedNotes.join("\n");
};

const renderSection = (marker: string, content: string): string =>
  `${marker}\n\n${content}`;

const readTemplateTests = (): string => readFileSync(templateTestsPath, "utf8").trim();

const renderTemplate = (): string => {
  const infoOverrides = readInfoOverrides();
  const artifact = buildGtmTemplateArtifact({
    displayName:
      typeof infoOverrides.displayName === "string"
        ? infoOverrides.displayName
        : undefined,
    description:
      typeof infoOverrides.description === "string"
        ? infoOverrides.description
        : undefined,
  });
  const mergedInfo = buildMergedInfo(artifact, infoOverrides);

  return UTF8_BOM + [
    renderSection("___TERMS_OF_SERVICE___", readTermsOfService()),
    renderSection("___INFO___", JSON.stringify(mergedInfo, null, 2)),
    renderSection(
      "___TEMPLATE_PARAMETERS___",
      JSON.stringify(artifact.parameters, null, 2),
    ),
    renderSection("___SANDBOXED_JS_FOR_WEB_TEMPLATE___", artifact.runtimeSource),
    renderSection(
      "___WEB_PERMISSIONS___",
      JSON.stringify(artifact.permissions, null, 2),
    ),
    renderSection("___TESTS___", readTemplateTests()),
    renderSection("___NOTES___", buildNotes()),
    "",
  ].join("\n\n");
};

const generatedTemplate = renderTemplate();

writeFileSync(templatePath, generatedTemplate, "utf8");

console.log(`Wrote ${path.basename(templatePath)}`);
