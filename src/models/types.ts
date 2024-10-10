export interface TestRunRequest {
  event_type: string;
  repoUrl: string;
  branch: string;
  commitSha: string;
}

export interface TestResult {
  event_type: string;
  success: boolean;
  output: string;
  errorMessage?: string;
}

export interface TestStage {
  name: string;
  command: string;
}
