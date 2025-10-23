import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { isAuthenticated } from "../auth/index.js";
import { AuthRequired } from "./AuthRequired.js";
import { HelpScreen } from "./HelpScreen.js";
import { InitCommand } from "./InitCommand.js";
import { LoginCommand } from "./LoginCommand.js";
import { LogoutCommand } from "./LogoutCommand.js";
import { StatusCommand } from "./StatusCommand.js";
import { WelcomeScreen } from "./WelcomeScreen.js";

interface AppProps {
	command?: string;
}

export const App: React.FC<AppProps> = ({ command }) => {
	const [authenticated, setAuthenticated] = useState<boolean | null>(null);
	const [currentScreen, setCurrentScreen] = useState<string>("loading");

	useEffect(() => {
		const checkAuth = async () => {
			const isAuth = await isAuthenticated();
			setAuthenticated(isAuth);

			// Determine which screen to show based on command and auth status
			if (command === "help" || command === "--help" || command === "-h") {
				setCurrentScreen("help");
			} else if (command === "auth:login") {
				setCurrentScreen("login");
			} else if (command === "auth:logout") {
				setCurrentScreen("logout");
			} else if (command === "auth:status") {
				setCurrentScreen("status");
			} else if (command === "init" || command === undefined) {
				if (isAuth) {
					setCurrentScreen("init");
				} else {
					setCurrentScreen("authRequired");
				}
			} else {
				setCurrentScreen("unknownCommand");
			}
		};

		checkAuth();
	}, [command]);

	if (authenticated === null) {
		return (
			<Box>
				<Text>Loading...</Text>
			</Box>
		);
	}

	const renderScreen = () => {
		switch (currentScreen) {
			case "help":
				return <HelpScreen />;

			case "login":
				return (
					<Box flexDirection="column">
						<WelcomeScreen />
						<LoginCommand />
					</Box>
				);

			case "logout":
				return <LogoutCommand />;

			case "status":
				return <StatusCommand />;

			case "authRequired":
				return (
					<Box flexDirection="column">
						<WelcomeScreen />
						<AuthRequired />
					</Box>
				);

			case "init":
				return (
					<Box flexDirection="column">
						<WelcomeScreen />
						<InitCommand />
					</Box>
				);

			case "unknownCommand":
				return (
					<Box flexDirection="column">
						<WelcomeScreen />
						<Box marginTop={1}>
							<Text color="red">❌ Unknown command: {command}</Text>
						</Box>
						<Box marginTop={1}>
							<Text>Run 'mittvibes help' to see available commands.</Text>
						</Box>
					</Box>
				);

			default:
				return <Text>Loading...</Text>;
		}
	};

	return renderScreen();
};
