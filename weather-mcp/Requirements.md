# Project Requirements

## Project Overview
Briefly describe the purpose and main goal of your project.  
A sample MCP server project that uses Spring AI that will allow client agent to invoke the weather API embeded in this MCP server.

## Key Features
List the core features needed for the project.
- Weather Service that can retrieve the current weather from OpenWeather API (https://openweathermap.org/)
- Expose Weather API as an resource in this MCP server
- All this MCP server as an remote MCP server for Github Copilot to integrate
- Provide authentication through username/password
- Create README file that will show how to configure the API key and authentication credential

## Technical Stack
Specify your preferred technologies, frameworks, or languages.
- JDK: jdk21
- Spring: Spring AI
- Authentication: JWT tokens

## APIs & Integrations
List any APIs or services to be used or integrated.
- OpenWeather - Current Weather Data API

## Environment & Tooling
Define the expected tooling and deployment context.
- Local development with Docker Compose
- Git for version control
- Instructions for running the project locally

## Testing Requirements
Outline the required tests or test frameworks.
- Unit tests with JUnit5
- Integration tests for core endpoints

## Documentation & Comments
Specify if you want inline code comments and/or markdown documentation.
- Well-commented code
- README.md with setup instructions

## Deliverables
List what you expect at handoff.
- Source code
- Dockerfile/docker-compose.yml
- README.md

## Extra Instructions
Any special requirements or constraints?
- Code must be modular and follow best practices
- Follow MCP server best practice

--- End ---
