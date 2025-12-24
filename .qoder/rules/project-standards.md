---
trigger: always_on
alwaysApply: true
---

# Always Apply Rules - Project Standards

These rules apply to ALL AI Chat and Inline Chat requests for the LuxeCut Barber Shop project.

## Communication Style
- Use simple, clear language when describing technical issues and solutions
- Avoid overly complex terminology unless specifically requested
- Focus on practical, actionable advice
- Explain security concepts in accessible terms

## Development Workflow
- Follow a safe, step-by-step implementation approach
- Analyze changes thoroughly before suggesting modifications
- Compare proposed changes with current system implementation
- Provide detailed plans with code examples when possible
- Never suggest making security checks public to fix errors

## Code Modification Principles
- NEVER modify authentication or authorization checks to bypass security
- Always maintain existing security standards
- Preserve backward compatibility when possible
- Follow established patterns in the codebase
- Ensure all authenticated API calls include CSRF tokens

## Security First
- Prioritize critical security features over non-critical features
- Validate customer authentication before modifying authenticated functions
- Never expose sensitive information in error messages
- Always use environment variables for configuration values

## Error Prevention
- Keep Edge Functions updated after schema changes
- Include CSRF tokens in authenticated API calls
- Use proper database joins (use app_users table for user joins)
- Maintain case sensitivity for database column names
- Follow ImageUpload component prop naming consistency
- Respect ImageUpload component size limits by entity type

When responding to any query about this project, always consider these standards and ensure your suggestions align with these principles.