# Weather MCP Server

This project is a sample MCP server using Spring AI, JDK 21, and JWT authentication. It exposes a weather service resource that retrieves current weather data from the OpenWeather API. The server is designed for integration with agent clients (e.g., GitHub Copilot).

## Features
- Weather Service: Retrieves current weather from OpenWeather API
- MCP Server: Exposes weather API as a resource
- Authentication: Username/password with JWT tokens
- Docker Compose for local development
- Unit tests (JUnit5) and integration tests

## Setup Instructions
1. **Clone the repository**
2. **Configure OpenWeather API Key and authentication credentials**
   - See `.env.example` for required environment variables
3. **Build and run with Docker Compose**
   ```sh
   docker-compose up --build
   ```
4. **Run locally**
   ```sh
   ./mvnw spring-boot:run
   ```

## API Documentation
- Weather endpoint: `/api/weather?city={city}`
- Authentication endpoint: `/api/auth/login`

## Testing
- Run unit and integration tests:
  ```sh
  ./mvnw test
  ```

## Best Practices
- Modular code structure
- Follows MCP server conventions

## References
- [OpenWeather API](https://openweathermap.org/)
- [Spring AI](https://spring.io/projects/spring-ai)
- [Model Context Protocol](https://modelcontextprotocol.io/llms-full.txt)

---
