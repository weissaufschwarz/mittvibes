import path from "node:path";
import { generateKey } from "@47ng/cloak";
import fs from "fs-extra";
import { Box, Text } from "ink";
import type React from "react";
import { useEffect, useState } from "react";
import type { ProjectConfig } from "../InitCommand.js";

interface CompletionScreenProps {
	config: ProjectConfig;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
	config,
}) => {
	const [envWritten, setEnvWritten] = useState(false);

	useEffect(() => {
		if (config.projectName && !envWritten) {
			const writeEnvFile = async () => {
				try {
					const projectPath = path.join(process.cwd(), config.projectName);
					const envPath = path.join(projectPath, ".env");

					// Generate Prisma encryption key (separate from extension secret)
					const prismaKey = generateKey();

					const envContent = `# Database
${config.setupDatabase && config.databaseUrl ? `DATABASE_URL="${config.databaseUrl}"` : 'DATABASE_URL="postgresql://USER:REPLACEME@localhost:5432/dbname"'}
PRISMA_FIELD_ENCRYPTION_KEY="${prismaKey}"

# mittwald Extension
EXTENSION_ID=${config.extensionId}
EXTENSION_SECRET=${config.extensionSecret}

NODE_ENV=development
`;

					await fs.writeFile(envPath, envContent);
					setEnvWritten(true);
				} catch (error) {
					console.error("Failed to write .env file:", error);
				}
			};

			writeEnvFile();
		}
	}, [config, envWritten]);

	return (
		<Box flexDirection="column">
			<Text color="white" bold>
				🎉 Your mittwald extension is ready for development!
			</Text>

			<Box marginTop={1}>
				<Text color="white" bold>
					Next Steps:
				</Text>
			</Box>
			<Box>
				<Text color="white"> 1. cd {config.projectName}</Text>
			</Box>
			<Box>
				<Text color="white"> 2. pnpm dev</Text>
			</Box>
			<Box>
				<Text color="white">
					3. Deploy to public URL (ngrok, cloudflared, etc.)
				</Text>
			</Box>
			{!config.frontendUrl && (
				<Box>
					<Text color="yellow">
						4. Update frontend URL in mStudio (currently set to placeholder)
					</Text>
				</Box>
			)}
			{config.frontendUrl && (
				<Box>
					<Text color="white">
						4. Frontend URL configured: {config.frontendUrl}
					</Text>
				</Box>
			)}
			{!config.webhookUrl && (
				<Box>
					<Text color="yellow">
						5. Update webhook URL in mStudio with your public URL
					</Text>
				</Box>
			)}
			{config.webhookUrl && (
				<Box>
					<Text color="white">
						5. Webhook URL configured: {config.webhookUrl}
					</Text>
				</Box>
			)}
			<Box>
				<Text color="white">6. Test extension installation in mStudio</Text>
			</Box>

			<Box marginTop={1}>
				<Text color="white" bold>
					Extension Configuration:
				</Text>
			</Box>
			<Box>
				<Text color="white"> • Extension ID: </Text>
				<Text color="green">{config.extensionId || "N/A"} ✓</Text>
			</Box>
			<Box>
				<Text color="white"> • Context: </Text>
				<Text color="green">{config.extensionContext} ✓</Text>
			</Box>
			<Box>
				<Text color="white"> • Scopes: </Text>
				<Text color="green">Empty ✓</Text>
			</Box>
			{config.installedInContext && (
				<Box>
					<Text color="white"> • Installed in: </Text>
					<Text color="green">
						{config.installedInContext}{" "}
						{config.installedInProject
							? `(project: ${config.installedInProject})`
							: config.installedInCustomer
								? `(organization: ${config.installedInCustomer})`
								: ""}{" "}
						✓
					</Text>
				</Box>
			)}
			{config.frontendUrl && (
				<Box>
					<Text color="white"> • Frontend URL: </Text>
					<Text color="green">{config.frontendUrl} ✓</Text>
				</Box>
			)}
			{!config.frontendUrl && (
				<Box>
					<Text color="white"> • Frontend URL: </Text>
					<Text color="yellow">Placeholder (update in mStudio)</Text>
				</Box>
			)}
			{config.webhookUrl && (
				<Box>
					<Text color="white"> • Webhook URL: </Text>
					<Text color="green">Configured ✓</Text>
				</Box>
			)}
			{!config.webhookUrl && (
				<Box>
					<Text color="white"> • Webhook URL: </Text>
					<Text color="yellow">Not configured (update in mStudio)</Text>
				</Box>
			)}

			<Box marginTop={1}>
				<Text>
					━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
				</Text>
			</Box>
			<Box marginTop={1}>
				<Text color="white" bold>
					📁 Your project is ready at:{" "}
				</Text>
				<Text color="white">
					{process.cwd()}/{config.projectName}
				</Text>
			</Box>
			<Box marginTop={1}>
				<Text color="gray">Quick start:</Text>
			</Box>
			<Box
				marginTop={0}
				paddingX={2}
				paddingY={1}
				borderStyle="single"
				borderColor="gray"
			>
				<Text color="cyan">cd {config.projectName} && pnpm dev</Text>
			</Box>
			<Box marginTop={1}>
				<Text>
					━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
				</Text>
			</Box>
		</Box>
	);
};
