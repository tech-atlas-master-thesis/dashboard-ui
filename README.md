# Technology Atlas - Dashboard UI


## Installation

To install all needed dependencies and set up the commit hooks run:
```bash
npm install
```

### Husky

The installation will also install and setup husky. Together with `lint-staged` this will be used on commits to run linters and code formatters.

## Development environment (TODO)

In future we should have a way to mock the backend. For example wiremock, json-server or other frameworks exist, we should pick one.

For local development there will in future be a `docker-compose.yml` file to set up the backends.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.


## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```
