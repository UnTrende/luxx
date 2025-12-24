---
trigger: manual
---
# Qoder Rules Configuration

This directory contains project-specific rules for the Qoder IDE that help optimize AI responses to align with the LuxeCut Barber Shop project's coding standards and requirements.

## Rule Types

### Always Apply Rules
- `project-standards.md` - Applies to all AI interactions, enforcing core project principles

### Specific Files Rules
- `edge-functions.md` - Applies to all files in `supabase/functions/`
- `api-service.md` - Applies to files in the `services/` directory

### Model Decision Rules
- `architecture-guidelines.md` - Guides architectural decisions
- `security-authentication.md` - Enforces security and authentication standards
- `code-quality.md` - Maintains code quality and best practices
- `generate-tests.md` - Provides guidance for generating unit tests
- `generate-comments.md` - Provides guidance for generating code comments

## How Rules Work

These rules help the AI understand:
1. Project-specific context and requirements
2. Coding standards and best practices
3. Security considerations
4. Architectural patterns
5. Testing expectations

The rules are automatically applied based on their type:
- Always Apply: Applied to all interactions
- Specific Files: Applied when working with matching files
- Model Decision: AI evaluates when to apply based on the task

## Adding New Rules

To add a new rule:
1. Create a new markdown file in this directory
2. Use appropriate frontmatter for rule type:
   - `---\ntrigger: always_on\nalwaysApply: true\n---` for Always Apply rules
   - `---\ntrigger: file_based\npatterns: ["*.ts", "*.tsx"]\n---` for Specific Files rules
   - `---\ntrigger: model_decision\ndescription: "Brief description"\n---` for Model Decision rules
3. Write clear, concise guidance following the existing patterns

## Best Practices

1. Keep rules focused and unambiguous
2. Use bullet points, numbered lists, or Markdown formatting for readability
3. Include code examples to guide the model
4. Regularly review and update rules based on team feedback