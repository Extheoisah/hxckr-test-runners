import { TestRepoManager } from "./testRepoManager";
import logger from "./logger";

export async function loadTestFile(
  challengeId: string,
  language: string,
  stage: number,
): Promise<string> {
  try {
    const testRepo = TestRepoManager.getInstance();
    const testContent = await testRepo.getTestContent(
      challengeId,
      language,
      stage,
    );

    logger.info("Test file loaded successfully", {
      challengeId,
      language,
      stage,
    });

    return testContent;
  } catch (error) {
    logger.error("Failed to load test file", {
      error,
      challengeId,
      language,
      stage,
    });
    throw new Error(`Test file not found for stage ${stage}`);
  }
}
