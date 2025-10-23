import crypto from "node:crypto";
import http from "node:http";
import open from "open";
import { saveAuthConfig } from "../utils/config.js";

// Fixed OAuth callback port (required by OAuth provider)
// Using port 52847 - high in user range (49152-65535), unlikely to conflict
const OAUTH_CALLBACK_PORT = 52847;
const OAUTH_CALLBACK_URL = `http://localhost:${OAUTH_CALLBACK_PORT}/callback`;

// OAuth endpoints (mittwald OAuth2)
const OAUTH_AUTHORIZE_URL = "https://api.mittwald.de/v2/oauth2/authorize";
const OAUTH_TOKEN_URL = "https://api.mittwald.de/v2/oauth2/token";

// OAuth client configuration
// Using PKCE flow - no client secret required
// This client_id must be registered with mittwald OAuth
// Redirect URI must be set to: http://localhost:52847/callback
const CLIENT_ID = "mittvibes"; // hard coded

interface TokenResponse {
	access_token: string;
	token_type: string;
}

function generatePKCEPair(): { verifier: string; challenge: string } {
	const verifier = crypto.randomBytes(32).toString("base64url");
	const challenge = crypto
		.createHash("sha256")
		.update(verifier)
		.digest("base64url");

	return { verifier, challenge };
}

function createCallbackServer(
	resolve: (value: string) => void,
	reject: (error: Error) => void,
): http.Server {
	const server = http.createServer(async (req, res) => {
		if (!req.url?.startsWith("/callback")) {
			res.writeHead(404);
			res.end("Not found");
			return;
		}

		const urlParams = new URL(
			req.url,
			`http://localhost:${OAUTH_CALLBACK_PORT}`,
		);
		const code = urlParams.searchParams.get("code");
		const error = urlParams.searchParams.get("error");

		if (error) {
			res.writeHead(400, { "Content-Type": "text/html" });
			res.end(`
        <html>
          <body style="font-family: system-ui; padding: 2rem; background: #000; color: #fff;">
            <h2>Authentication Failed</h2>
            <p>Error: ${error}</p>
            <p>You can close this window and return to the CLI.</p>
          </body>
        </html>
      `);
			server.close();
			reject(new Error(`OAuth error: ${error}`));
			return;
		}

		if (!code) {
			res.writeHead(400, { "Content-Type": "text/html" });
			res.end(`
        <html>
          <body style="font-family: system-ui; padding: 2rem; background: #000; color: #fff;">
            <h2>Authentication Failed</h2>
            <p>No authorization code received.</p>
            <p>You can close this window and return to the CLI.</p>
          </body>
        </html>
      `);
			server.close();
			reject(new Error("No authorization code received"));
			return;
		}

		// Success response
		res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
		res.end(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>mittvibes CLI - Authentication Complete</title>
          <style>
            body {
              font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
              padding: 3rem 2rem;
              background: #000;
              color: #fff;
              margin: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              text-align: center;
            }
            .success {
              font-size: 1.5rem;
              font-weight: bold;
              margin-bottom: 1rem;
              color: #fff;
            }
            .checkmark {
              color: #fff;
              font-size: 2rem;
              margin-right: 0.5rem;
            }
            .instruction {
              font-size: 1rem;
              color: #ccc;
              margin-top: 1rem;
            }
            .brand {
              color: #666;
              font-size: 0.9rem;
              margin-top: 2rem;
            }
          </style>
        </head>
        <body>
          <div class="success">
            <span class="checkmark">✓</span>Authentication Successful
          </div>
          <div class="instruction">You can close this window and return to the CLI.</div>
          <div class="brand">mittvibes CLI</div>
        </body>
      </html>
    `);

		server.close();
		resolve(code);
	});

	return server;
}

async function exchangeCodeForToken(
	code: string,
	verifier: string,
): Promise<TokenResponse> {
	const params = new URLSearchParams({
		grant_type: "authorization_code",
		code,
		redirect_uri: OAUTH_CALLBACK_URL,
		client_id: CLIENT_ID,
		code_verifier: verifier,
	});

	const response = await fetch(OAUTH_TOKEN_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params.toString(),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Token exchange failed: ${error}`);
	}

	return response.json() as Promise<TokenResponse>;
}

export interface OAuthFlowResult {
	authUrl: string;
	openBrowser: () => Promise<void>;
	waitForCompletion: () => Promise<void>;
	cleanup: () => void;
}

export async function startOAuthFlow(): Promise<OAuthFlowResult> {
	// Generate PKCE pair
	const { verifier, challenge } = generatePKCEPair();

	// Store server reference for cleanup
	let server: http.Server | null = null;

	// Create callback server
	const authCodePromise = new Promise<string>((resolve, reject) => {
		server = createCallbackServer(resolve, reject);

		server.listen(OAUTH_CALLBACK_PORT, () => {
			// Server is ready
		});

		// Handle server errors
		server.on("error", (error: NodeJS.ErrnoException) => {
			if (error.code === "EADDRINUSE") {
				reject(
					new Error(
						`Port ${OAUTH_CALLBACK_PORT} is already in use. Please close any other applications using this port and try again.`,
					),
				);
			} else {
				reject(error);
			}
		});
	});

	// Generate state parameter for CSRF protection
	const state = crypto.randomBytes(16).toString("hex");

	// Build authorization URL
	const authUrl = `${OAUTH_AUTHORIZE_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
		OAUTH_CALLBACK_URL,
	)}&response_type=code&scope=${encodeURIComponent(
		"user:read project:read project:write customer:read customer:write extension:read extension:write",
	)}&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`;

	return {
		authUrl,
		openBrowser: async () => {
			await open(authUrl);
		},
		waitForCompletion: async () => {
			// Wait for auth code
			const authCode = await authCodePromise;

			// Exchange code for tokens
			const tokenResponse = await exchangeCodeForToken(authCode, verifier);

			// Save tokens
			await saveAuthConfig({
				accessToken: tokenResponse.access_token,
			});
		},
		cleanup: () => {
			if (server?.listening) {
				server.close();
			}
		},
	};
}
