import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const templatePath = path.resolve("template.tpl");
const templateSourceDirPath = path.resolve("template-source");
const infoOverridesPath = path.join(templateSourceDirPath, "info-overrides.json");

const extractSection = (
  source: string,
  startMarker: string,
  endMarker: string,
): string => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Unable to extract section from ${startMarker} to ${endMarker}`);
  }

  return source.slice(start + startMarker.length, end).trim();
};

const readTemplate = (templatePath: string): string => readFileSync(templatePath, "utf8");

const readTemplateBytes = (templatePath: string): Uint8Array => readFileSync(templatePath);

const parseInfo = (templatePath: string): Record<string, unknown> => {
  const template = readTemplate(templatePath).replace(/^\uFEFF/, "");
  const infoSection = extractSection(template, "___INFO___", "___TEMPLATE_PARAMETERS___");
  return JSON.parse(infoSection) as Record<string, unknown>;
};

const parseParameters = (templatePath: string): unknown[] => {
  const template = readTemplate(templatePath).replace(/^\uFEFF/, "");
  const parametersSection = extractSection(
    template,
    "___TEMPLATE_PARAMETERS___",
    "___SANDBOXED_JS_FOR_WEB_TEMPLATE___",
  );
  return JSON.parse(parametersSection) as unknown[];
};

test("generated template preserves UTF-8 BOM", () => {
  const bytes = readTemplateBytes(templatePath);
  expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
});

test("generated template preserves source info overrides and gallery metadata", () => {
  const sourceInfo = JSON.parse(readFileSync(infoOverridesPath, "utf8")) as Record<string, unknown>;
  const generatedInfo = parseInfo(templatePath);

  expect(generatedInfo.id).toBe(sourceInfo.id);
  expect(generatedInfo.displayName).toBe(sourceInfo.displayName);
  expect(generatedInfo.description).toBe(sourceInfo.description);
  expect(generatedInfo.categories).toEqual(sourceInfo.categories);
  expect(generatedInfo.securityGroups).toEqual(sourceInfo.securityGroups);
  expect(generatedInfo.brand?.displayName).toBe(sourceInfo.brandDisplayName);
  expect(generatedInfo.type).toBe("TAG");
  expect(generatedInfo.version).toBe(1);
  expect(generatedInfo.containerContexts).toEqual(["WEB"]);
  expect(generatedInfo.brand?.thumbnail).toContain("data:image/png;base64,");
});

test("generated template keeps a valid empty tests manifest", () => {
  const template = readTemplate(templatePath).replace(/^\uFEFF/, "");
  const testsSection = extractSection(template, "___TESTS___", "___NOTES___");
  expect(testsSection.includes("scenarios:")).toBe(true);
  expect(testsSection.includes("Loader URL uses encoded API key")).toBe(true);
  expect(testsSection.includes("Fixed dark theme sets init colorScheme")).toBe(true);
  expect(testsSection.includes("Automatic consent can force analytics measurement denied")).toBe(true);
  expect(testsSection.includes("Intelligent identity reads common data layer signals")).toBe(true);
  expect(testsSection.includes("Intelligent identity skips data layer when permission is denied")).toBe(true);
  expect(testsSection.includes("Advanced identity can encode email as the primary identity")).toBe(true);
  expect(testsSection.includes("Inject passes a failure handler to injectScript")).toBe(true);
  expect(testsSection.includes("Inject passes a success handler to injectScript")).toBe(true);
});

test("generated template exposes identify fields", () => {
  const parameters = parseParameters(templatePath) as Array<Record<string, unknown>>;
  const identifyGroup = parameters.find((parameter) => parameter.name === "identifyGroup");

  expect(identifyGroup).toBeDefined();
  expect(identifyGroup?.type).toBe("GROUP");

  const subParams = Array.isArray(identifyGroup?.subParams)
    ? (identifyGroup.subParams as Array<Record<string, unknown>>)
    : [];
  const names = subParams.map((parameter) => parameter.name);

  expect(names).toEqual([
    "identifyMode",
    "identifyPrimaryIdentityType",
    "identifyPrimaryIdentityValue",
    "identifyTraits",
  ]);
});

test("generated runtime excludes retired queue contract patterns", () => {
  const template = readTemplate(templatePath).replace(/^\uFEFF/, "");
  const runtimeSection = extractSection(
    template,
    "___SANDBOXED_JS_FOR_WEB_TEMPLATE___",
    "___WEB_PERMISSIONS___",
  );

  expect(runtimeSection.includes("widget.js")).toBe(false);
  expect(runtimeSection.includes("setThemeDefault")).toBe(false);
  expect(runtimeSection.includes("setThemeSourceAttr")).toBe(false);
  expect(/consent\s*:\s*\{/.test(runtimeSection)).toBe(false);
  expect(runtimeSection.includes("Array.")).toBe(false);
  expect(runtimeSection.includes("encodeURIComponent")).toBe(false);
  expect(runtimeSection.includes("return result;\n};\n};")).toBe(false);
  expect(runtimeSection.includes("defaultConsent")).toBe(true);
  expect(runtimeSection.includes('kind: "identify"')).toBe(true);
  expect(runtimeSection.includes("copyFromDataLayer")).toBe(true);
  expect(runtimeSection.includes("identifyPrimaryIdentityType")).toBe(true);
  expect(runtimeSection.includes("identifyPrimaryIdentityValue")).toBe(true);
  expect(runtimeSection.includes("intelligentIdentifyUserIdKeys")).toBe(true);
});
