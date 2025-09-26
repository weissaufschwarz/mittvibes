import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { execSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import fetch from "node-fetch";
import yauzl from "yauzl";
import { generateKey } from "@47ng/cloak";
import { selectOrganization } from "./organization.js";
import { getProjects } from "../api/mittwald.js";

const pipelineAsync = promisify(pipeline);

async function downloadAndExtractTemplate(projectName: string): Promise<string> {
  const tempDir = path.join(process.cwd(), `${projectName}-temp`);
  const zipPath = path.join(tempDir, "repo.zip");

  // Create temp directory
  await fs.ensureDir(tempDir);

  try {
    // Download the ZIP file
    const response = await fetch("https://github.com/weissaufschwarz/mittvibes/archive/refs/heads/main.zip");
    if (!response.ok) {
      throw new Error(`Failed to download template: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("No response body received");
    }

    // Save ZIP file
    await pipelineAsync(response.body, createWriteStream(zipPath));

    // Extract ZIP file
    return new Promise<string>((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err || !zipfile) {
          reject(err || new Error("Failed to open ZIP file"));
          return;
        }

        zipfile.readEntry();
        zipfile.on("entry", (entry) => {
          // We want entries from the templates directory
          if (entry.fileName.startsWith("mittvibes-main/templates/")) {
            const relativePath = entry.fileName.replace("mittvibes-main/templates/", "");

            if (relativePath && !entry.fileName.endsWith("/")) {
              const outputPath = path.join(tempDir, "extracted", relativePath);

              // Ensure directory exists
              fs.ensureDirSync(path.dirname(outputPath));

              zipfile.openReadStream(entry, (err, readStream) => {
                if (err || !readStream) {
                  reject(err || new Error("Failed to read ZIP entry"));
                  return;
                }

                const writeStream = createWriteStream(outputPath);
                readStream.pipe(writeStream);
                writeStream.on("close", () => {
                  zipfile.readEntry();
                });
              });
            } else {
              zipfile.readEntry();
            }
          } else {
            zipfile.readEntry();
          }
        });

        zipfile.on("end", () => {
          resolve(path.join(tempDir, "extracted"));
        });

        zipfile.on("error", reject);
      });
    });
  } finally {
    // Clean up ZIP file but keep extracted contents
    if (await fs.pathExists(zipPath)) {
      await fs.remove(zipPath);
    }
  }
}

interface ProjectConfig {
  mode: "new" | "existing";
  projectName: string;
  installDeps: boolean;
  setupDatabase: boolean;
  databaseUrl?: string;
  runMigration: boolean;
  isContributor: boolean;
  extensionContext: "customer" | "project";
  selectedContextId?: string;
  extensionId?: string;
  extensionSecret?: string;
}

// Main init function (extracted from old index.ts)
export async function init(): Promise<void> {
  try {
    // Step 1: Organization Selection
    console.log(chalk.bold.white("\n🎯 Organization Setup\n"));
    console.log(chalk.white("First, let's select which organization you want to create an extension for."));

    const { selectedCustomerId, isContributor: hasContributorAccess } = await selectOrganization();

    if (!hasContributorAccess) {
      // This shouldn't happen as selectOrganization handles non-contributors
      console.log(chalk.bold.white("\n❌ No contributor access"));
      process.exit(1);
    }

    console.log(chalk.green("\n✓ Organization confirmed with contributor access"));

    // Step 2: Extension Context Selection
    console.log(chalk.bold.white("\n📍 Extension Context Selection\n"));
    console.log(chalk.white("Choose the context where your extension will be available:"));

    const { extensionContext } = await inquirer.prompt<Pick<ProjectConfig, "extensionContext">>([
      {
        type: "list",
        name: "extensionContext",
        message: "Where should users access your extension?",
        choices: [
          {
            name: "Customer Level - Available in organization menu",
            value: "customer" as const,
          },
          {
            name: "Project Level - Available in individual project menus",
            value: "project" as const,
          },
        ],
      },
    ]);

    // Step 3: Context-specific Selection
    let selectedContextId: string;
    if (extensionContext === "project") {
      console.log(chalk.bold.white("\n📂 Project Selection\n"));
      console.log(chalk.white("Loading your projects..."));

      try {
        const projects = await getProjects();

        if (projects.length === 0) {
          console.log(chalk.bold.white("\n❌ No projects found"));
          console.log(chalk.gray("You need at least one project to create a project-level extension."));
          process.exit(1);
        }

        const { selectedProjectId } = await inquirer.prompt([
          {
            type: "list",
            name: "selectedProjectId",
            message: "Select the project for testing your extension:",
            choices: projects.map((project) => ({
              name: `${project.description} (${project.id})`,
              value: project.id,
            })),
          },
        ]);
        selectedContextId = selectedProjectId;
      } catch (error) {
        console.log(chalk.bold.white("\n❌ Failed to load projects"));
        console.log(chalk.gray(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
      }
    } else {
      // For customer context, use the selected customer ID
      selectedContextId = selectedCustomerId;
    }

    console.log(chalk.green(`\n✓ Extension context: ${extensionContext} (${selectedContextId})`));

    // Generate context-specific anchor URL
    const anchorUrl = extensionContext === "customer"
      ? "/customers/customer/menu/section/extensions/item"
      : "/projects/project/menu/section/extensions/item";

    // Step 4: Welcome & Mode Selection
    const { mode } = await inquirer.prompt<Pick<ProjectConfig, "mode">>([
      {
        type: "list",
        name: "mode",
        message:
          "Are you starting a new project or continuing with an existing boilerplate?",
        choices: [
          { name: "Start new project", value: "new" as const },
          {
            name: "Continue with existing boilerplate",
            value: "existing" as const,
          },
        ],
      },
    ]);

    if (mode === "existing") {
      console.log(
        chalk.white(
          "\n📁 Please navigate to your existing project directory and continue from there."
        )
      );
      process.exit(0);
    }

    // Step 2: Project Configuration
    const { projectName } = await inquirer.prompt<
      Pick<ProjectConfig, "projectName">
    >([
      {
        type: "input",
        name: "projectName",
        message: "What is the name of your extension project?",
        default: "my-mittwald-extension",
        validate: (input: string) => {
          if (/^[a-z0-9-]+$/.test(input)) {
            return true;
          }
          return "Project name can only contain lowercase letters, numbers, and hyphens";
        },
      },
    ]);

    // Create project directory
    const projectPath = path.join(process.cwd(), projectName);
    if (await fs.pathExists(projectPath)) {
      console.log(
        chalk.bold.white(`\n❌ Directory ${projectName} already exists!`)
      );
      process.exit(1);
    }

    const spinner = ora("Downloading project template...").start();

    try {
      // Download and extract the template
      const extractedPath = await downloadAndExtractTemplate(projectName);

      // Copy extracted templates to project path
      await fs.copy(extractedPath, projectPath, {
        filter: (src) => !src.includes("node_modules") && !src.includes(".git"),
      });

      // Clean up temporary directory
      await fs.remove(path.join(process.cwd(), `${projectName}-temp`));

      // Update package.json with project name
      const packageJsonPath = path.join(projectPath, "package.json");
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = projectName;
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

      spinner.succeed(chalk.white("Project structure created!"));
    } catch (error) {
      spinner.fail(chalk.white("Failed to download template repository"));
      console.log(chalk.bold.white(`❌ Error: ${error instanceof Error ? error.message : error}`));
      console.log(chalk.gray("Please check your internet connection and try again."));

      // Clean up on error
      const tempDir = path.join(process.cwd(), `${projectName}-temp`);
      if (await fs.pathExists(tempDir)) {
        await fs.remove(tempDir);
      }

      process.exit(1);
    }

    // Step 3: Dependency Installation
    const { installDeps } = await inquirer.prompt<
      Pick<ProjectConfig, "installDeps">
    >([
      {
        type: "confirm",
        name: "installDeps",
        message: "Would you like to install dependencies now? (pnpm install)",
        default: true,
      },
    ]);

    if (installDeps) {
      const installSpinner = ora(
        "Installing dependencies with pnpm..."
      ).start();
      try {
        execSync("pnpm install", { cwd: projectPath, stdio: "inherit" });
        installSpinner.succeed(
          chalk.white("Dependencies installed successfully!")
        );
      } catch {
        installSpinner.fail(chalk.white("Failed to install dependencies"));
        console.log(
          chalk.gray(
            'Please run "pnpm install" manually in your project directory.'
          )
        );
      }
    }

    // Step 4: Prerequisites Setup
    console.log(chalk.bold.white("\n🗄️  Database Configuration\n"));

    const { setupDatabase } = await inquirer.prompt<
      Pick<ProjectConfig, "setupDatabase">
    >([
      {
        type: "confirm",
        name: "setupDatabase",
        message: "Would you like to configure the PostgreSQL database now?",
        default: true,
      },
    ]);

    if (setupDatabase) {
      const { databaseUrl } = await inquirer.prompt<
        Pick<ProjectConfig, "databaseUrl">
      >([
        {
          type: "input",
          name: "databaseUrl",
          message: "Enter your PostgreSQL connection URL (non-pooling):",
          validate: (input: string) => {
            if (
              input.startsWith("postgresql://") ||
              input.startsWith("postgres://")
            ) {
              return true;
            }
            return "Please enter a valid PostgreSQL URL (should start with postgresql:// or postgres://)";
          },
        },
      ]);

      // Generate Prisma encryption key using @47ng/cloak
      const encryptionKey = generateKey();

      // Generate extension secret automatically
      const extensionSecret = generateKey();

      // Create .env file
      const envContent = `# Database
DATABASE_URL="${databaseUrl}"
PRISMA_FIELD_ENCRYPTION_KEY="${encryptionKey}"

# mittwald Extension
EXTENSION_ID=REPLACE_ME
EXTENSION_SECRET=${extensionSecret}

# mittwald Organization
MITTWALD_CUSTOMER_ID=${selectedCustomerId}

# Extension Context
EXTENSION_CONTEXT=${extensionContext}
EXTENSION_CONTEXT_ID=${selectedContextId}
EXTENSION_ANCHOR_URL=${anchorUrl}

NODE_ENV=development
`;

      const envPath = path.join(projectPath, ".env");
      try {
        await fs.writeFile(envPath, envContent);
        // Verify the file was created
        if (await fs.pathExists(envPath)) {
          console.log(chalk.white(`✓ .env file created in ${projectName}/`));
        } else {
          console.log(
            chalk.bold.white(
              `⚠️  .env file creation may have failed in ${projectName}/`
            )
          );
        }
      } catch (error) {
        console.log(
          chalk.bold.white(
            `❌ Failed to create .env file: ${
              error instanceof Error ? error.message : error
            }`
          )
        );
        console.log(
          chalk.gray(
            "Please create the .env file manually with your database credentials."
          )
        );
      }

      // Generate Prisma client and run migrations
      if (installDeps) {
        const { runMigration } = await inquirer.prompt<
          Pick<ProjectConfig, "runMigration">
        >([
          {
            type: "confirm",
            name: "runMigration",
            message:
              "Would you like to generate Prisma client and run the initial migration?",
            default: true,
          },
        ]);

        if (runMigration) {
          const migrationSpinner = ora("Generating Prisma client...").start();
          try {
            execSync("pnpm db:generate", { cwd: projectPath, stdio: "pipe" });
            migrationSpinner.text = "Running database migration...";
            execSync("pnpm db:migrate:deploy", {
              cwd: projectPath,
              stdio: "pipe",
            });
            migrationSpinner.succeed(chalk.white("Database setup completed!"));
          } catch {
            migrationSpinner.fail(chalk.white("Failed to setup database"));
            console.log(
              chalk.gray(
                'Please run "pnpm db:generate" and "pnpm db:migrate:deploy" manually.'
              )
            );
          }
        }
      }
    }

    // Runtime environment setup
    console.log(chalk.bold.white("\n🌐 Runtime Environment Setup\n"));
    console.log(chalk.white("Please follow these steps:"));
    console.log("1. Upload your generated hello world extension");
    console.log(
      "2. Expose it to the internet (e.g., using ngrok, cloudflared, or a hosting service)"
    );
    console.log("3. Note down the public URL for webhook configuration\n");

    // Step 5: Extension Configuration (we already confirmed contributor status)
    {
      console.log(chalk.bold.white("\n🎯 Extension Development Setup\n"));

      console.log(chalk.bold.white("Required Manual Steps:"));
      console.log(chalk.white("1. Create Extension in mStudio Contributor UI:"));
      console.log(chalk.gray('   • Navigate to "Entwicklung" in your organization'));
      console.log(chalk.gray('   • Create a new extension and copy the EXTENSION_ID'));
      console.log(chalk.gray('   • Set extension context to: ') + chalk.bold(extensionContext));
      console.log(chalk.gray('   • Set anchor URL to: ') + chalk.bold(anchorUrl));
      console.log(chalk.gray('   • Leave scopes empty for now'));
      console.log(chalk.gray('   • Set webhook URL to your public endpoint\n'));

      const { extensionId } = await inquirer.prompt<Pick<ProjectConfig, "extensionId">>([
        {
          type: "input",
          name: "extensionId",
          message: "Enter your EXTENSION_ID (from mStudio):",
          validate: (input: string) => {
            if (input.trim().length > 0) {
              return true;
            }
            return "EXTENSION_ID is required";
          },
        },
      ]);

      console.log(chalk.bold.white("\n2. Development Workflow:"));
      console.log(chalk.white(`   • Extension Secret: ${chalk.green('Auto-generated ✓')}`));
      console.log(chalk.white(`   • Context: ${chalk.green(`${extensionContext} ✓`)}`));
      console.log(chalk.white(`   • Anchor URL: ${chalk.green(`${anchorUrl} ✓`)}`));
      console.log(chalk.white(`   • Scopes: ${chalk.green('Empty (as requested) ✓')}`));

      console.log(chalk.bold.white("\n3. Next Steps:"));
      console.log(chalk.white(`   cd ${projectName}`));
      console.log(chalk.white("   pnpm dev"));
      console.log(chalk.white("   • Deploy to public URL (ngrok, cloudflared, etc.)"));
      console.log(chalk.white("   • Test extension installation in mStudio\n"));

      // Update .env file with extension ID
      const envPath = path.join(projectPath, ".env");
      try {
        let envContent = "";

        if (await fs.pathExists(envPath)) {
          // Update existing .env file
          envContent = await fs.readFile(envPath, "utf8");
          envContent = envContent.replace(
            "EXTENSION_ID=REPLACE_ME",
            `EXTENSION_ID=${extensionId}`
          );
        } else {
          // Create new .env file with minimal content
          const newExtensionSecret = generateKey();
          envContent = `# mittwald Extension
EXTENSION_ID=${extensionId}
EXTENSION_SECRET=${newExtensionSecret}

# mittwald Organization
MITTWALD_CUSTOMER_ID=${selectedCustomerId}

# Extension Context
EXTENSION_CONTEXT=${extensionContext}
EXTENSION_CONTEXT_ID=${selectedContextId}
EXTENSION_ANCHOR_URL=${anchorUrl}

NODE_ENV=development
`;
        }

        await fs.writeFile(envPath, envContent);
        console.log(chalk.green("✓ Extension configuration saved to .env file"));
      } catch {
        console.log(chalk.bold.white("⚠️  Could not save extension configuration to .env file"));
        console.log(chalk.gray("Please create/update them manually in your .env file"));
      }

      console.log(chalk.bold.white("🎉 Your mittwald extension is ready for development!\n"));
    }

    console.log(chalk.white("━".repeat(60)));
    console.log(
      `${chalk.bold.white("\n📁 Your project is ready at: ")}${chalk.white(projectPath)}`
    );
    console.log(chalk.white(`${"━".repeat(60)}\n`));
  } catch (error) {
    console.error(
      chalk.bold.white("\n❌ Error:"),
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}