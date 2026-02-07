# Developer Runbooks

This directory contains step-by-step guides for common development tasks in the GERBONI project. Runbooks help prevent recurring bugs by documenting best practices and gotchas.

## Available Runbooks

### Setup & Configuration
- **Environment Setup** - Install dependencies, configure env vars, start services
- **Database Migrations** - Create, run, and rollback Alembic migrations

### Development Workflows
- [Adding New Static Assets](./adding-new-static-assets.md) - Fonts, images, icons (prevents BUG-002)
- [Adding New Pages](./adding-new-pages.md) - Locale-based routes, i18n (prevents BUG-001, BUG-003)
- [Order State Transitions](./order-state-transitions.md) - Managing order lifecycle (prevents BUG-004)
- [Flush/Commit Pattern](./flush-commit-pattern.md) - Service `flush()` / API `commit()` transaction boundaries (prevents BUG-004, BUG-005)

### Testing & Debugging
- **Writing Tests** - Unit, integration, E2E test patterns
- **Debugging Websocket Issues** - AI agent chat troubleshooting
- **Debugging Stripe Webhooks** - Payment flow troubleshooting

### Deployment
- **Docker Deployment** - Building and running containers
- **Production Checklist** - Pre-deployment verification steps

## Runbook Template

Each runbook follows this structure:

```markdown
# Task Name

**Purpose**: Why you need to do this task
**Risk Level**: Low | Medium | High | Critical
**Related Bugs**: Links to bugs this prevents

## Prerequisites
- Tools/access needed
- Knowledge required

## Step-by-Step Instructions
1. Clear, numbered steps
2. With code examples
3. And expected output

## Verification
How to verify the task was completed successfully

## Troubleshooting
Common issues and solutions

## Related Documentation
Links to relevant docs
```

## Quick Links by Bug

| Bug ID | Related Runbook | Purpose |
|--------|----------------|---------|
| [BUG-001](../bug-fixes/BUG-001-faq-i18n.md) | [Adding New Pages](./adding-new-pages.md) | Prevent hard-coded strings in locale routes |
| [BUG-002](../bug-fixes/BUG-002-middleware-assets.md) | [Adding New Static Assets](./adding-new-static-assets.md) | Prevent middleware from blocking assets |
| [BUG-003](../bug-fixes/BUG-003-root-path-layout.md) | [Adding New Pages](./adding-new-pages.md) | Ensure root route works with locale routing |
| [BUG-004](../bug-fixes/BUG-004-admin-order-service.md) | [Order State Transitions](./order-state-transitions.md) | Use correct service method signatures |

## When to Use Runbooks

**Use a runbook when**:
- Performing a task for the first time
- Task has multiple steps that could be forgotten
- Task has caused bugs in the past
- Onboarding new team members

**Update a runbook when**:
- You discover a new edge case
- Architecture changes (e.g., new middleware pattern)
- Bug is fixed and you learn prevention steps

## Contributing New Runbooks

1. **Identify a recurring task** that causes confusion or errors
2. **Write clear step-by-step instructions** with code examples
3. **Test the runbook** by following it yourself
4. **Add to this README** in appropriate section
5. **Link from related bugs** if applicable

## Runbook Quality Checklist

A good runbook:
- [ ] Has clear prerequisites listed
- [ ] Uses numbered steps (easy to follow)
- [ ] Includes code examples with syntax highlighting
- [ ] Shows expected output/behavior
- [ ] Has troubleshooting section for common issues
- [ ] Links to related documentation
- [ ] Can be followed by someone unfamiliar with the task

## Related Documentation

- [Bug Fixes Index](../bug-fixes/README.md)
- [Testing Strategy](../testing/README.md)
- [Known Fragile Areas](../../CLAUDE.md#known-fragile-areas)
