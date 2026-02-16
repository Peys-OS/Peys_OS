# Contributing to PeyDot

Thank you for your interest in contributing to PeyDot! This document outlines the process for contributing to our project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before contributing.

## How Can I Contribute?

### Reporting Bugs

1. Check if the bug has already been reported
2. Create a detailed bug report
3. Include:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details

### Suggesting Features

1. Check the roadmap for existing plans
2. Describe the feature in detail
3. Explain why it would be beneficial
4. Include any mockups or examples

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests if applicable
5. Ensure code passes linting
6. Commit with clear messages
7. Push to your fork
8. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18+
- Foundry
- Git

### Local Development

```bash
# Clone repository
git clone https://github.com/peydot/peydot-magic-links.git
cd peydot-magic-links

# Install dependencies
npm install

# Run tests
npm test

# Start development
npm run dev
```

### Smart Contract Development

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Build contracts
forge build

# Run contract tests
forge test

# Format code
forge fmt
```

## Style Guides

### JavaScript/TypeScript

- Use ESLint for linting
- Follow existing code style
- Use meaningful variable names
- Add comments for complex logic

### Solidity

- Follow Solidity style guide
- Use NatSpec comments
- Include events for state changes
- Write comprehensive tests

### Git Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Fix bug" not "Fixes bug")
- Limit first line to 72 characters
- Reference issues and pull requests

## Recognition

Contributors will be recognized in our README and on our website.

---

## Questions?

If you have any questions, feel free to:
- Open an issue
- Join our Discord
- Email us at hello@peydot.app

Thank you for contributing to PeyDot!
