Component Structure:
MCP Host Layer (Blue)

CopilotChatManager: Chat interaction handling
LanguageModel: AI processing components
VSCodeIntegration: Editor and UI integration

MCP Client Layer (Purple)

MCPClientPlugin: Main plugin services
MCPProtocolManager: Protocol communication handling

MCP Server Layer (Green)

SpringAIMCPServer: Core MCP server functionality
BitBucketIntegration: Repository-specific services

Data Access Layer (Orange)

LocalDataManager: Caching, indexing, and configuration
ExternalServiceManager: External API clients

Key Relationships:

Dotted arrows: Interface implementations
Solid arrows: Service dependencies and data flow
Bidirectional arrows: Protocol communication

The diagram now renders properly and shows the complete component architecture of your MCP system!RetryClaude can make mistakes. Please double-check responses. Sonnet 4