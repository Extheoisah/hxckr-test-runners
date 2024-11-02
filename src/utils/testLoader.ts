import fs from "fs/promises";
import path from "path";
import logger from "./logger";

export async function loadTestFile(
  challengeId: string,
  language: string,
  stage: number,
): Promise<string> {
  const testExtensions: Record<string, string> = {
    typescript: ".test.ts",
    // we will add more languages as needed
  };

  const extension = testExtensions[language];
  if (!extension) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const testPath = path.join(
    __dirname,
    "..",
    "tests",
    challengeId,
    language,
    `stage${stage}${extension}`,
  );

  try {
    const testContent = await fs.readFile(testPath, "utf-8");
    logger.info("Test file loaded successfully", {
      challengeId,
      language,
      stage,
      testPath,
    });
    return testContent;
  } catch (error) {
    logger.error("Failed to load test file", {
      error,
      challengeId,
      language,
      stage,
      testPath,
    });
    throw new Error(`Test file not found for stage ${stage}`);
  }
}
