import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { getCustomersWithContributorStatus, submitContributorInterest } from "../api/mittwald.js";

interface CustomerWithContributorStatus {
  customerId: string;
  name: string;
  description?: string;
  isContributor: boolean;
}

interface OrganizationSelectionResult {
  selectedCustomerId: string;
  isContributor: boolean;
  continueToInit: boolean;
}

export async function selectOrganization(): Promise<OrganizationSelectionResult> {
  const spinner = ora("Fetching your organizations...").start();

  try {
    // Fetch all customer organizations with contributor status
    const customers = await getCustomersWithContributorStatus();
    spinner.stop();

    if (customers.length === 0) {
      console.log(chalk.bold.white("\n❌ No Organizations Found\n"));
      console.log(chalk.white("You don't have access to any organizations."));
      console.log(chalk.gray("Please make sure you have the correct permissions.\n"));
      process.exit(1);
    }

    console.log(chalk.bold.white("\n🏢 Select Organization\n"));

    // Create choices with contributor status indicators
    const choices = customers.map(customer => ({
      name: `${customer.name} ${customer.isContributor
        ? chalk.green("(✓ Contributor)")
        : chalk.gray("(Not a contributor)")}`,
      value: customer.customerId,
      short: customer.name,
    }));

    const { selectedCustomerId } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedCustomerId",
        message: "Which organization would you like to use?",
        choices,
        pageSize: 10,
      },
    ]);

    const selectedCustomer = customers.find(c => c.customerId === selectedCustomerId);

    if (!selectedCustomer) {
      throw new Error("Selected organization not found");
    }

    console.log(chalk.white(`\nSelected: ${chalk.bold(selectedCustomer.name)}`));

    // Handle contributor vs non-contributor flow
    if (selectedCustomer.isContributor) {
      console.log(chalk.green("✓ This organization is already a contributor"));
      return {
        selectedCustomerId,
        isContributor: true,
        continueToInit: true,
      };
    } else {
      return await handleNonContributorFlow(selectedCustomer);
    }

  } catch (error) {
    spinner.fail(chalk.white("Failed to fetch organizations"));
    console.error(
      chalk.bold.white("\n❌ Error:"),
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

async function handleNonContributorFlow(
  customer: CustomerWithContributorStatus
): Promise<OrganizationSelectionResult> {
  console.log(chalk.yellow("\n⚠️  This organization is not yet a contributor"));
  console.log(chalk.white(`Organization: ${customer.name}`));
  console.log(chalk.gray("To create mittwald extensions, the organization needs contributor status.\n"));

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        {
          name: "Submit interest to become a contributor",
          value: "submit_interest",
        },
        {
          name: "Select a different organization",
          value: "select_different",
        },
        {
          name: "Exit and apply manually",
          value: "exit",
        },
      ],
    },
  ]);

  switch (action) {
    case "submit_interest":
      return await submitInterestFlow(customer);

    case "select_different":
      return await selectOrganization(); // Recursively call to select again

    case "exit":
      console.log(chalk.bold.white("\n📚 Manual Contributor Application\n"));
      console.log(chalk.white("To become a contributor, please follow the guide at:"));
      console.log(chalk.underline.white(
        "https://developer.mittwald.de/de/docs/v2/contribution/how-to/become-contributor/\n"
      ));
      process.exit(0);

    default:
      throw new Error("Invalid action selected");
  }
}

async function submitInterestFlow(
  customer: CustomerWithContributorStatus
): Promise<OrganizationSelectionResult> {
  console.log(chalk.bold.white("\n📝 Submit Contributor Interest\n"));
  console.log(chalk.white(`Organization: ${customer.name}`));
  console.log(chalk.gray("This will submit your interest to become a contributor.\n"));

  const { confirmSubmit } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmSubmit",
      message: "Submit interest to become a contributor?",
      default: true,
    },
  ]);

  if (!confirmSubmit) {
    return await selectOrganization(); // Go back to organization selection
  }

  const spinner = ora("Submitting contributor interest...").start();

  try {
    await submitContributorInterest(customer.customerId);
    spinner.succeed(chalk.white("Interest submitted successfully!"));

    console.log(chalk.bold.white("\n✓ Interest Submitted\n"));
    console.log(chalk.white("Your interest to become a contributor has been submitted."));
    console.log(chalk.gray("You will be notified when your application is reviewed.\n"));

    const { nextAction } = await inquirer.prompt([
      {
        type: "list",
        name: "nextAction",
        message: "What would you like to do now?",
        choices: [
          {
            name: "Select a different organization (if you have contributor access)",
            value: "select_different",
          },
          {
            name: "Exit and wait for approval",
            value: "exit",
          },
        ],
      },
    ]);

    if (nextAction === "select_different") {
      return await selectOrganization();
    } else {
      console.log(chalk.gray("\nYou can run 'mittvibes' again once you have contributor status.\n"));
      process.exit(0);
    }

  } catch (error) {
    spinner.fail(chalk.white("Failed to submit interest"));
    console.error(
      chalk.bold.white("\n❌ Error:"),
      error instanceof Error ? error.message : error
    );

    const { retry } = await inquirer.prompt([
      {
        type: "confirm",
        name: "retry",
        message: "Would you like to try again?",
        default: true,
      },
    ]);

    if (retry) {
      return await submitInterestFlow(customer);
    } else {
      return await selectOrganization();
    }
  }
}