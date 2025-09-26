import chalk from "chalk";

export function showHelp(): void {
  console.log(chalk.bold.white(`
███╗   ███╗██╗████████╗████████╗██╗   ██╗██╗██████╗ ███████╗███████╗
████╗ ████║██║╚══██╔══╝╚══██╔══╝██║   ██║██║██████╔╗██╔════╝██╔════╝
██╔████╔██║██║   ██║      ██║   ██║   ██║██║██████╔╝█████╗  ███████╗
██║╚██╔╝██║██║   ██║      ██║   ╚██╗ ██╔╝██║██╔══██╗██╔══╝  ╚════██║
██║ ╚═╝ ██║██║   ██║      ██║    ╚████╔╝ ██║██████╔╝███████╗███████║
╚═╝     ╚═╝╚═╝   ╚═╝      ╚═╝     ╚═══╝  ╚═╝╚═════╝ ╚══════╝╚══════╝

                    powered by weissaufschwarz
`));

  console.log(chalk.bold.white("CLI tool to generate boilerplate for mittwald extensions\n"));

  console.log(chalk.bold("Usage:"));
  console.log(chalk.white("  mittvibes [command]\n"));

  console.log(chalk.bold("Commands:"));
  console.log(chalk.white("  init           ") + chalk.gray("Initialize a new mittwald extension project (default)"));
  console.log(chalk.white("  auth:login     ") + chalk.gray("Authenticate with mittwald OAuth"));
  console.log(chalk.white("  auth:logout    ") + chalk.gray("Clear authentication tokens"));
  console.log(chalk.white("  auth:status    ") + chalk.gray("Check authentication status"));
  console.log(chalk.white("  help           ") + chalk.gray("Show this help message\n"));

  console.log(chalk.bold("Examples:"));
  console.log(chalk.gray("  # Authenticate with mittwald"));
  console.log(chalk.white("  mittvibes auth:login\n"));

  console.log(chalk.gray("  # Create a new extension project"));
  console.log(chalk.white("  mittvibes\n"));

  console.log(chalk.gray("  # Check authentication status"));
  console.log(chalk.white("  mittvibes auth:status\n"));

  console.log(chalk.gray("  # Show help"));
  console.log(chalk.white("  mittvibes help\n"));

  console.log(chalk.bold("Notes:"));
  console.log(chalk.gray("  • Authentication is required before creating projects"));
  console.log(chalk.gray("  • OAuth callback uses port 52847 (must be available)"));
  console.log(chalk.gray("  • Configuration is stored in ~/.mittvibes/config.json\n"));
}