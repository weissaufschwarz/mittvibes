#!/usr/bin/env node

import chalk from "chalk";
import { init } from "./commands/init.js";
import { showHelp } from "./commands/help.js";
import { login, logout, status, isAuthenticated } from "./auth/index.js";

// Get command from arguments
const args = process.argv.slice(2);
const command = args[0];

// Welcome message with ASCII art
const welcomeArt = `
███╗   ███╗██╗████████╗████████╗██╗   ██╗██╗██████╗ ███████╗███████╗
████╗ ████║██║╚══██╔══╝╚══██╔══╝██║   ██║██║██╔══██╗██╔════╝██╔════╝
██╔████╔██║██║   ██║      ██║   ██║   ██║██║██████╔╝█████╗  ███████╗
██║╚██╔╝██║██║   ██║      ██║   ╚██╗ ██╔╝██║██╔══██╗██╔══╝  ╚════██║
██║ ╚═╝ ██║██║   ██║      ██║    ╚████╔╝ ██║██████╔╝███████╗███████║
╚═╝     ╚═╝╚═╝   ╚═╝      ╚═╝     ╚═══╝  ╚═╝╚═════╝ ╚══════╝╚══════╝

                    powered by weissaufschwarz
`;


// Main CLI function
async function main(): Promise<void> {
  try {
    // Handle commands
    switch (command) {
      case "help":
      case "--help":
      case "-h":
        showHelp();
        break;

      case "auth:login":
        console.log(chalk.bold.white(welcomeArt));
        await login();
        break;

      case "auth:logout":
        await logout();
        break;

      case "auth:status":
        await status();
        break;

      case "init":
      case undefined:
        // Check authentication for init command
        if (!(await isAuthenticated())) {
          console.log(chalk.bold.white(welcomeArt));
          console.log(chalk.bold.white("\n🔐 Authentication Required\n"));
          console.log(chalk.white("You must authenticate before creating projects."));
          console.log(chalk.white("\nPlease run:"));
          console.log(chalk.bold.white("  mittvibes auth:login\n"));
          console.log(chalk.gray("After authentication, you can run 'mittvibes' to create your project.\n"));
          process.exit(1);
        }

        console.log(chalk.bold.white(welcomeArt));
        await init();
        break;

      default:
        console.log(chalk.bold.white(welcomeArt));
        console.log(chalk.bold.white(`\n❌ Unknown command: ${command}\n`));
        console.log(chalk.white("Run 'mittvibes help' to see available commands.\n"));
        process.exit(1);
    }
  } catch (error) {
    console.error(
      chalk.bold.white("\n❌ Error:"),
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// Run the CLI
main().catch((error) => {
  console.error(chalk.bold.white("Fatal error:"), error);
  process.exit(1);
});