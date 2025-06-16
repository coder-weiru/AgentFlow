import * as vscode from 'vscode';
import { 
    CopilotChat, 
    ChatContext, 
    ChatRequest, 
    ChatResponse,
    ChatResponseStream,
    LanguageModelChatMessage,
    LanguageModelChatMessageRole
} from 'vscode';

// MCP Protocol Types
interface MCPRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: any;
}

interface MCPResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

interface BitBucketResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
    content?: string;
}

interface MCPServerConfig {
    serverUrl: string;
    bitbucketWorkspace: string;
    bitbucketRepo: string;
    accessToken?: string;
}

class MCPClient {
    private config: MCPServerConfig;
    private requestId = 0;

    constructor(config: MCPServerConfig) {
        this.config = config;
    }

    private async sendRequest(method: string, params?: any): Promise<any> {
        const request: MCPRequest = {
            jsonrpc: '2.0',
            id: ++this.requestId,
            method,
            params
        };

        try {
            const response = await fetch(this.config.serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.accessToken && {
                        'Authorization': `Bearer ${this.config.accessToken}`
                    })
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const mcpResponse: MCPResponse = await response.json();
            
            if (mcpResponse.error) {
                throw new Error(`MCP Error ${mcpResponse.error.code}: ${mcpResponse.error.message}`);
            }

            return mcpResponse.result;
        } catch (error) {
            console.error('MCP Request failed:', error);
            throw error;
        }
    }

    async initialize(): Promise<void> {
        await this.sendRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {
                resources: { subscribe: true, listChanged: true }
            },
            clientInfo: {
                name: 'GitHub Copilot MCP Plugin',
                version: '1.0.0'
            }
        });
    }

    async listResources(): Promise<BitBucketResource[]> {
        const result = await this.sendRequest('resources/list');
        return result.resources || [];
    }

    async readResource(uri: string): Promise<string> {
        const result = await this.sendRequest('resources/read', { uri });
        return result.contents?.[0]?.text || '';
    }

    async searchCodeInRepo(query: string, fileType?: string): Promise<BitBucketResource[]> {
        const result = await this.sendRequest('bitbucket/search', {
            workspace: this.config.bitbucketWorkspace,
            repository: this.config.bitbucketRepo,
            query,
            fileType
        });
        return result.files || [];
    }

    async getFileContent(filePath: string): Promise<string> {
        const result = await this.sendRequest('bitbucket/file', {
            workspace: this.config.bitbucketWorkspace,
            repository: this.config.bitbucketRepo,
            path: filePath
        });
        return result.content || '';
    }
}

class BitBucketCodeProvider {
    private mcpClient: MCPClient;

    constructor(mcpClient: MCPClient) {
        this.mcpClient = mcpClient;
    }

    async getRelevantCode(context: string, language?: string): Promise<string> {
        try {
            // Search for relevant files based on context
            const resources = await this.mcpClient.searchCodeInRepo(context, language);
            
            let codeContext = '';
            
            // Fetch content for top relevant files (limit to prevent overwhelming context)
            const maxFiles = 5;
            const relevantFiles = resources.slice(0, maxFiles);
            
            for (const resource of relevantFiles) {
                try {
                    const content = await this.mcpClient.readResource(resource.uri);
                    codeContext += `\n\n// File: ${resource.name}\n${content}`;
                } catch (error) {
                    console.warn(`Failed to fetch ${resource.name}:`, error);
                }
            }
            
            return codeContext;
        } catch (error) {
            console.error('Failed to get relevant code:', error);
            return '';
        }
    }

    async getFileStructure(): Promise<string> {
        try {
            const resources = await this.mcpClient.listResources();
            const structure = resources
                .map(r => `- ${r.name}: ${r.description || 'No description'}`)
                .join('\n');
            return `Repository Structure:\n${structure}`;
        } catch (error) {
            console.error('Failed to get file structure:', error);
            return 'Unable to fetch repository structure';
        }
    }
}

class CopilotMCPChatParticipant {
    private mcpClient: MCPClient;
    private codeProvider: BitBucketCodeProvider;

    constructor(config: MCPServerConfig) {
        this.mcpClient = new MCPClient(config);
        this.codeProvider = new BitBucketCodeProvider(this.mcpClient);
    }

    async initialize(): Promise<void> {
        await this.mcpClient.initialize();
    }

    async handleChatRequest(
        request: ChatRequest,
        context: ChatContext,
        stream: ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<ChatResponse> {
        try {
            const userMessage = request.prompt;
            
            // Extract relevant information from the user's request
            const activeDocument = vscode.window.activeTextEditor?.document;
            const language = activeDocument?.languageId;
            const currentCode = activeDocument?.getText();
            
            // Get relevant code from BitBucket repository
            stream.progress('Fetching relevant code from repository...');
            const relevantCode = await this.codeProvider.getRelevantCode(userMessage, language);
            
            // Get repository structure if requested
            let repoStructure = '';
            if (userMessage.toLowerCase().includes('structure') || 
                userMessage.toLowerCase().includes('overview')) {
                stream.progress('Analyzing repository structure...');
                repoStructure = await this.codeProvider.getFileStructure();
            }
            
            // Prepare context for the language model
            const contextMessages: LanguageModelChatMessage[] = [];
            
            // System message with repository context
            contextMessages.push({
                role: LanguageModelChatMessageRole.System,
                content: `You are a code assistant with access to a BitBucket repository. 
                Use the following repository context to help answer questions and generate code:
                
                ${repoStructure}
                
                Relevant code from repository:
                ${relevantCode}
                
                Current file language: ${language || 'unknown'}
                
                Provide helpful, accurate responses based on the repository context and best practices.`
            });
            
            // Add current file context if available
            if (currentCode && activeDocument) {
                contextMessages.push({
                    role: LanguageModelChatMessageRole.User,
                    content: `Current file (${activeDocument.fileName}):\n\`\`\`${language}\n${currentCode}\n\`\`\``
                });
            }
            
            // Add user's actual question
            contextMessages.push({
                role: LanguageModelChatMessageRole.User,
                content: userMessage
            });
            
            // Stream the response
            stream.progress('Generating response...');
            
            return {
                metadata: {
                    command: 'bitbucket-assist'
                }
            };
            
        } catch (error) {
            console.error('Chat request failed:', error);
            stream.markdown(`❌ **Error**: Failed to process request: ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            return {
                metadata: {
                    command: 'error'
                }
            };
        }
    }
}

// VS Code Extension Activation
export function activate(context: vscode.ExtensionContext) {
    // Get configuration
    const config = vscode.workspace.getConfiguration('copilotMCP');
    const mcpConfig: MCPServerConfig = {
        serverUrl: config.get('serverUrl', 'http://localhost:8080/mcp'),
        bitbucketWorkspace: config.get('bitbucketWorkspace', ''),
        bitbucketRepo: config.get('bitbucketRepo', ''),
        accessToken: config.get('accessToken')
    };
    
    // Validate configuration
    if (!mcpConfig.serverUrl || !mcpConfig.bitbucketWorkspace || !mcpConfig.bitbucketRepo) {
        vscode.window.showErrorMessage(
            'Please configure MCP server settings in VS Code settings (copilotMCP.*)'
        );
        return;
    }
    
    // Create chat participant
    const chatParticipant = new CopilotMCPChatParticipant(mcpConfig);
    
    // Initialize MCP client
    chatParticipant.initialize().catch(error => {
        console.error('Failed to initialize MCP client:', error);
        vscode.window.showErrorMessage(`MCP initialization failed: ${error.message}`);
    });
    
    // Register chat participant
    const participant = vscode.chat.createChatParticipant('bitbucket-mcp', async (request, context, stream, token) => {
        return await chatParticipant.handleChatRequest(request, context, stream, token);
    });
    
    participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'assets', 'bitbucket-icon.png');
    participant.followupProvider = {
        provideFollowups(result, context, token) {
            return [
                {
                    prompt: 'Show me the repository structure',
                    label: '📁 Repository Structure'
                },
                {
                    prompt: 'Find similar code patterns',
                    label: '🔍 Find Patterns'
                },
                {
                    prompt: 'Suggest improvements',
                    label: '💡 Suggest Improvements'
                }
            ];
        }
    };
    
    context.subscriptions.push(participant);
    
    // Register commands
    const disposable = vscode.commands.registerCommand('copilotMCP.refreshConnection', async () => {
        try {
            await chatParticipant.initialize();
            vscode.window.showInformationMessage('MCP connection refreshed successfully');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to refresh MCP connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
    
    context.subscriptions.push(disposable);
    
    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(cloud) MCP Connected";
    statusBarItem.tooltip = "Connected to MCP BitBucket Server";
    statusBarItem.command = 'copilotMCP.refreshConnection';
    statusBarItem.show();
    
    context.subscriptions.push(statusBarItem);
}

export function deactivate() {
    // Cleanup code here
}