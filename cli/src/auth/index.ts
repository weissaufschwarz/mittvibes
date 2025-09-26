import chalk from "chalk";
import ora from "ora";
import {
  isAuthenticated,
  getAuthConfig,
  clearAuthConfig
} from "../utils/config.js";
import { startOAuthFlow } from "./oauth.js";

export async function login(): Promise<void> {
  // Check if already authenticated
  if (await isAuthenticated()) {
    const auth = await getAuthConfig();
    console.log(chalk.white("\n✓ You are already authenticated"));
    if (auth?.userId) {
      console.log(chalk.gray(`  User ID: ${auth.userId}`));
    }
    console.log(chalk.gray("\nTo re-authenticate, run: mittvibes auth:logout first\n"));
    return;
  }

  console.log(chalk.bold.white("\n🔐 mittwald Authentication\n"));
  console.log(chalk.white("This will open your browser to authenticate with mittwald."));
  console.log(chalk.gray("Make sure port 52847 is available on your system.\n"));

  try {
    await startOAuthFlow();
    console.log(chalk.white("\nYou can now use mittvibes to create extension projects.\n"));
  } catch (error) {
    console.error(
      chalk.bold.white("\n❌ Authentication failed:"),
      error instanceof Error ? error.message : error
    );
    console.log(chalk.gray("\nPlease try again or check your network connection.\n"));
    process.exit(1);
  }
}

export async function logout(): Promise<void> {
  const spinner = ora("Logging out...").start();

  try {
    await clearAuthConfig();
    spinner.succeed(chalk.white("Successfully logged out"));
    console.log(chalk.gray("\nYour authentication tokens have been removed.\n"));
  } catch (error) {
    spinner.fail(chalk.white("Failed to logout"));
    console.error(
      chalk.bold.white("\n❌ Error:"),
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

export async function status(): Promise<void> {
  console.log(chalk.bold.white("\n🔐 Authentication Status\n"));

  if (await isAuthenticated()) {
    const auth = await getAuthConfig();
    console.log(chalk.white("✓ Authenticated"));

    if (auth?.userId) {
      console.log(chalk.gray(`  User ID: ${auth.userId}`));
    }
    if (auth?.organizationId) {
      console.log(chalk.gray(`  Organization: ${auth.organizationId}`));
    }
  } else {
    console.log(chalk.white("✗ Not authenticated"));
    console.log(chalk.gray("\nRun 'mittvibes auth:login' to authenticate"));
  }

  console.log();
}

// Re-export isAuthenticated for use in main CLI
export { isAuthenticated } from "../utils/config.js";