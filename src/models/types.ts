export interface TestRunRequest {
  event_type: string;
  repoUrl: string;
  branch: string;
  commitSha: string;
}

export interface TestResult {
  success: boolean;
  output: string;
  errorMessage?: string;
}

export interface TestStage {
  name: string;
  command: string;
}
