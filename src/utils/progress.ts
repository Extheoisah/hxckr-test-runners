import axios from "axios";
import logger from "./logger";
import { config } from "../config/config";
import { ProgressResponse } from "../models/types";

export async function fetchUserProgress(
  repoUrl: string,
): Promise<ProgressResponse> {
  try {
    const response = await axios.get<ProgressResponse>(
      `${config.baseUrl}/progress`,
      {
        params: { repo_url: repoUrl },
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error: any) {
    logger.error("Failed to fetch user progress", { error, repoUrl });
    throw new Error(`Failed to fetch progress: ${error.message}`);
  }
}
