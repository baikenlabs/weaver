# Weaver

A minimal dependency injection container with **Command Pattern and ProxyFacade support**, especially designed for AWS Lambda functions, focused on reducing transpiled code size and cold start times.

## Why Weaver?

AWS Lambda has strict size limits and cold start concerns. Weaver addresses these by:

- **Minimal Footprint**: Zero runtime dependencies, resulting in smaller bundle sizes
- **Optimized Transpilation**: Designed to produce compact JavaScript code compatible with Lambda's Node.js runtime
- **Lambda-First Architecture**: CommonJS output format, no unnecessary abstractions
- **Fast Resolution**: Simple Map-based DI with minimal overhead
- **Cold Start Friendly**: Lightweight initialization that doesn't impact Lambda cold starts
- **Command Pattern Support**: Built-in support for Command pattern with ProxyFacade
- **Dynamic Command Loading**: Efficient lazy loading of command implementations

Perfect for serverless architectures where every kilobyte and millisecond counts.

## Installation

```bash
npm install @baikenlabs/weaver
```

## Features

- **Dependency Injection**: Simple, lightweight DI container
- **Command Pattern**: Built-in `Command<TInput, TOutput>` interface for command implementations
- **ProxyFacade**: Factory for executing commands with dependency injection
- **Minimal transpiled code output**: Perfect for Lambda package size limits
- **Zero runtime dependencies**: No external packages needed
- **TypeScript support**: Full type definitions included
- **CommonJS format**: Optimized for AWS Lambda
- **Symbol support**: Use symbols as service identifiers
- **Mock support**: Easy testing with mock implementations
- **Static DEPS**: Simple dependency declaration (no decorators needed)
- **Dynamic imports**: Lazy loading of command implementations

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

### Command Pattern with ProxyFacade

The `ProxyFacade` pattern allows you to implement commands that are lazily loaded and executed through the DI container.

```typescript
import { Command } from 'voidweaver';
import { ProxyFactory } from 'voidweaver';

// Define your command
interface CreateUserInput {
  name: string;
  email: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

class CreateUserCommand implements Command<CreateUserInput, User> {
  static readonly DEPS = [];

  async execute(input: CreateUserInput): Promise<User> {
    return {
      id: `user-${Date.now()}`,
      name: input.name,
      email: input.email,
    };
  }
}

// Create a facade that uses ProxyFactory
class UserService {
  static readonly DEPS = [ProxyFactory];

  constructor(private readonly proxyFactory: ProxyFactory) {}

  async createUser(input: CreateUserInput): Promise<User> {
    return this.proxyFactory.execute(
      (await import('./commands')).CreateUserCommand,
      input
    );
  }
}

// Setup container
import { WEAVER_REGISTRY } from 'voidweaver';

const container = new DIContainer();
container.register(WEAVER_REGISTRY, container);
container.register(ProxyFactory);
container.register(UserService);
container.register(CreateUserCommand);

// Use the service
const userService = container.resolve<UserService>(UserService);
const user = await userService.createUser({
  name: 'John Doe',
  email: 'john@example.com',
});
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

### Complete Example

See the [TBD](https://google.com) file for a complete working example demonstrating:

- Command pattern implementation
- ProxyFacade usage
- Full CRUD operations
- Proper DI container setup

## API

### DIContainer

#### `register<T>(constructor: Constructor<T> | symbol, val?: unknown)`

Register a service in the container. If a symbol is provided, the second argument is used as the value.

**Parameters:**

- `constructor`: Class constructor or symbol to register
- `val`: (Optional) Value to register for the symbol

**Example:**

```typescript
container.register(UserService);
container.register(DB_TOKEN, databaseInstance);
```

#### `registerMock<T>(constructor: Constructor<T> | symbol, val?: unknown)`

Register a mock service for testing purposes.

**Parameters:**

- `constructor`: Class constructor to mock
- `val`: (Optional) Mock implementation

**Example:**

```typescript
const mockDb = { connect: vi.fn() };
container.registerMock(Database, mockDb);
```

#### `resolve<T>(constructor: Constructor<unknown> | symbol, useMocked?: boolean, isFirstExecution?: boolean): T`

Resolve a service from the container, automatically injecting its dependencies.

**Parameters:**

- `constructor`: Class constructor or symbol to resolve
- `useMocked`: (Optional) Whether to use mocked dependencies
- `isFirstExecution`: (Optional) Internal flag for nested resolution

**Returns:** Instance of the requested service

**Example:**

```typescript
const userService = container.resolve<UserService>(UserService);
```

#### `clear()`

Clear all registered services from the container.

### Command Interface

```typescript
interface Command<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
```

Implement this interface to create command classes that can be executed through the ProxyFactory.

**Type Parameters:**

- `TInput`: The type of input the command accepts
- `TOutput`: The type of output the command returns

### ProxyFactory

#### `execute<TI, TO, T>(clazz: Constructor<T>, input: TI): Promise<TO>`

Execute a command through the DI container with automatic dependency resolution.

**Type Parameters:**

- `TI`: Input type
- `TO`: Output type
- `T`: Command class type

**Parameters:**

- `clazz`: Command class constructor (typically from dynamic import)
- `input`: Input data for the command

**Returns:** Promise resolving to command output

**Example:**

```typescript
const result = await proxyFactory.execute(
  (await import('./commands')).CreateUserCommand,
  { name: 'John', email: 'john@example.com' }
);
```

## Requirements

- Node.js >= 18.0.0

## License

ISC
