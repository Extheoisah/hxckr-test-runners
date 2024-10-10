# Test Runner Service

The Test Runner Service is a robust, scalable system designed to execute tests for various programming languages in isolated environments. It integrates with RabbitMQ for message queuing, uses Nix for consistent execution environments, and supports multiple programming languages.

## Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Architecture](#architecture)
7. [Adding Support for New Languages](#adding-support-for-new-languages)
8. [Troubleshooting](#troubleshooting)
9. [Contributing](#contributing)
10. [License](#license)

## Features

- Support for multiple programming languages (currently TypeScript, with easy extensibility)
- RabbitMQ integration for distributed test execution
- Isolated test environments using Nix
- Git repository cloning and management
- Modular and extensible architecture

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- RabbitMQ server
- Nix package manager or Devbox
- Git

## Installation

### Option 1: Standard Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-org/test-runner-service.git
   cd test-runner-service
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables (see [Configuration](#configuration) section)

4. Build the project:
   ```
   npm run build
   ```

### Option 2: Setup with Devbox

1. Install Devbox by following the instructions at https://www.jetpack.io/devbox/docs/installing_devbox/

2. Clone the repository:
   ```
   git clone https://github.com/your-org/test-runner-service.git
   cd test-runner-service
   ```

3. Initialize Devbox environment:
   ```
   devbox shell
   ```

5. Set up environment variables (see [Configuration](#configuration) section)

6. Build the project:
   ```
   devbox run dev
   ```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
RABBITMQ_HOST=
RABBITMQ_PORT=
RABBITMQ_USERNAME=
RABBITMQ_PASSWORD=
```

Adjust these values according to your environment.

## Usage

1. Install dependencies:
   ```
   yarn
   ```
   Or if using Devbox:
   ```
   devbox run dev
   ```

2. Run the service:
   ```
   yarn dev
   ```
   Or if using Devbox:
   ```
   devbox run dev
   ```

2. The service will start listening for test run requests on the RabbitMQ queue defined in `config/rabbitmq.ts`.

3. To submit a test run request, publish a message to the `test_runner_queue` with the following format:
   ```json
   {
     "repoUrl": "https://github.com/user/repo.git",
     "branch": "main",
     "commitSha": ""
   }
   ```

4. The service will clone the repository, execute the tests/program, and publish the results to the `test_results_queue`.


## Adding Support for New Languages

To add support for a new programming language:

1. Add a new configuration in `config/config.ts` under `LANGUAGE_CONFIGS`.
2. Create a new Nix shell file in `supportedLanguageShell/` if not available already.
3. Update the `getLanguageConfig` function in `config/config.ts` to detect the new language.
4. If necessary, add language-specific logic in `utils/testExecutor.ts`.

## Troubleshooting

- Check RabbitMQ connection if the service isn't receiving messages.
- Ensure Nix is properly installed and configured.
- Verify that the necessary language runtimes are available in the Nix environment.
- If using Devbox, ensure it's correctly installed and the project environment is properly initialized.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.
