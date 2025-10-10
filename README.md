# Voidweaver

A minimal dependency injection container **especially designed for AWS Lambda functions**, focused on reducing transpiled code size and cold start times.

## Why Voidweaver?

AWS Lambda has strict size limits and cold start concerns. Voidweaver addresses these by:

- **Minimal Footprint**: Zero runtime dependencies, resulting in smaller bundle sizes
- **Optimized Transpilation**: Designed to produce compact JavaScript code compatible with Lambda's Node.js runtime
- **Lambda-First Architecture**: CommonJS output format, no unnecessary abstractions
- **Fast Resolution**: Simple Map-based DI with minimal overhead
- **Cold Start Friendly**: Lightweight initialization that doesn't impact Lambda cold starts

Perfect for serverless architectures where every kilobyte and millisecond counts.

## Installation

```bash
npm install voidweaver
```

## Features

- Minimal transpiled code output (perfect for Lambda package size limits)
- Zero runtime dependencies
- TypeScript support with full type definitions
- CommonJS format optimized for AWS Lambda
- Support for symbols as service identifiers
- Mock support for testing
- Simple static DEPS declaration (no decorators needed)

## Usage

### Basic Example

```typescript
import { DIContainer } from 'voidweaver';

// Define your classes with DEPS property
class Database {
  static DEPS = [];

  connect() {
    console.log('Connected to database');
  }
}

class UserService {
  static DEPS = [Database];

  constructor(private db: Database) {}

  getUsers() {
    this.db.connect();
    return ['user1', 'user2'];
  }
}

// Create container and register services
const container = new DIContainer();
container.register(Database);
container.register(UserService);

// Resolve services
const userService = container.resolve<UserService>(UserService);
const users = userService.getUsers();
```

### Using with AWS Lambda

```typescript
import { DIContainer } from 'voidweaver';
import { Handler } from 'aws-lambda';

// Initialize container outside handler for reuse
const container = new DIContainer();
container.register(Database);
container.register(UserService);

export const handler: Handler = async (event) => {
  const userService = container.resolve<UserService>(UserService);

  return {
    statusCode: 200,
    body: JSON.stringify(userService.getUsers()),
  };
};
```

### Using Symbols

```typescript
const DB_TOKEN = Symbol('Database');

container.register(DB_TOKEN, new Database());

const db = container.resolve<Database>(DB_TOKEN);
```

### Testing with Mocks

```typescript
import { describe, it, expect } from 'vitest';

describe('UserService', () => {
  it('should use mocked database', () => {
    const container = new DIContainer();

    const mockDb = { connect: () => {} };
    container.registerMock(Database, mockDb);
    container.register(UserService);

    const service = container.resolve<UserService>(UserService, true);
    // service now uses mockDb
  });
});
```

## API

### `register<T>(constructor: Constructor<T> | symbol, val?: unknown)`

Register a service in the container. If a symbol is provided, the second argument is used as the value.

### `registerMock<T>(constructor: Constructor<T> | symbol, val?: unknown)`

Register a mock service for testing purposes.

### `resolve<T>(constructor: Constructor<unknown> | symbol, useMocked?: boolean, isFirstExecution?: boolean): T`

Resolve a service from the container, automatically injecting its dependencies.

### `clear()`

Clear all registered services from the container.

## Requirements

- Node.js >= 18.0.0

## License

ISC
