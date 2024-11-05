export interface TestRunRequest {
  repoUrl: string;
  branch: string;
  commitSha: string;
  challengeId: string;
}

export interface TestResult {
  event_type: string;
  commitSha: string;
  repoUrl: string;
  success: boolean;
  output: string;
  errorMessage?: string;
}

export interface TestStage {
  name: string;
  command: string;
}

export interface ProgressDetails {
  current_step: number;
}

export interface ProgressResponse {
  id: string;
  user_id: string;
  challenge_id: string;
  status: string;
  progress_details: ProgressDetails;
  created_at: string;
  updated_at: string;
}

export interface TestRepoConfig {
  repoUrl: string;
  branch: string;
  testsPath: string;
}
