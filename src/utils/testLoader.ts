import { TestRepoManager } from "./testRepoManager";
import logger from "./logger";

export async function loadTestFile(
  challengeId: string,
  language: string,
  stage: number,
): Promise<string | null> {
  // Changed return type
  try {
    const testRepo = TestRepoManager.getInstance();
    const testContent = await testRepo.getTestContent(
      challengeId,
      language,
      stage,
    );

    if (testContent) {
      logger.info("Test file loaded successfully", {
        challengeId,
        language,
        stage,
      });
    } else {
      logger.info("No test file found, will run code directly", {
        challengeId,
        language,
        stage,
      });
    }

    return testContent;
  } catch (error) {
    logger.error("Failed to load test file", {
      error,
      challengeId,
      language,
      stage,
    });
    return null; // Return null instead of throwing error
  }
}
