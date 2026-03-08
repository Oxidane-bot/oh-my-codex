---
name: code-review
description: Run a comprehensive code review
---
<skill>
<identity>
Code Review is the canonical review skill for the consolidation wave.
Conduct a thorough code review for quality, security, and maintainability with severity-rated feedback.
A full code review now explicitly includes the security-review behavior that previously lived on a separate surface.
</identity>

<when_to_use>
This skill activates when:
- User requests "review this code", "code review"
- Before merging a pull request
- After implementing a major feature
- User wants quality assessment
- User wants a comprehensive review that includes security risk assessment
</when_to_use>

<workflow>
<gpt54_guidance>
## GPT-5.4 Guidance Alignment

- Default to concise, evidence-dense progress and completion reporting unless the user or risk level requires more detail.
- Treat newer user task updates as local overrides for the active workflow branch while preserving earlier non-conflicting constraints.
- If correctness depends on additional inspection, retrieval, execution, or verification, keep using the relevant tools until the review is grounded.
- Continue through clear, low-risk, reversible next steps automatically; ask only when the next step is materially branching, destructive, or preference-dependent.
</gpt54_guidance>

<what_it_does>
Delegates to the `code-reviewer` agent (THOROUGH tier) for deep analysis.

<scope_detection>
1. **Identify Changes**
   - Run `git diff` to find changed files
   - Determine scope of review (specific files or entire PR)
   - Read the relevant requirements/spec context before scoring the change
</scope_detection>

<review_axes>
2. **Review Categories**
   <security>
   - **Security** - Hardcoded secrets, injection risks, XSS, CSRF, auth/authz flaws, dependency risk, and applicable OWASP Top 10 categories
   - Run secrets scans and dependency audit steps when the touched files make them relevant
   </security>
   <code_quality>
   - **Code Quality** - Function size, complexity, nesting depth, logic gaps
   </code_quality>
   <performance>
   - **Performance** - Algorithm efficiency, N+1 queries, caching
   </performance>
   <best_practices>
   - **Best Practices** - Naming, documentation, error handling
   </best_practices>
   <maintainability>
   - **Maintainability** - Duplication, coupling, testability
   </maintainability>
</review_axes>

<severity_rating>
3. **Severity Rating**
   - **CRITICAL** - Security vulnerability or correctness issue that must fix before merge
   - **HIGH** - Bug or major code smell (should fix before merge)
   - **MEDIUM** - Minor issue (fix when possible)
   - **LOW** - Style/suggestion (consider fixing)
</severity_rating>

<recommendations>
4. **Specific Recommendations**
   - File:line locations for each issue
   - Concrete fix suggestions
   - Code examples where applicable
   - Approval recommendation aligned to the highest-severity finding
</recommendations>
</what_it_does>

<agent_delegation>
## Agent Delegation

The `code-reviewer` agent is the canonical review surface.

```
delegate(
  role="code-reviewer",
  tier="THOROUGH",
  prompt="CODE REVIEW TASK

Review code changes for quality, security, and maintainability.
Security review is part of this canonical surface.

Scope: [git diff or specific files]

Review Checklist:
- Stage 1 spec compliance
- Security vulnerabilities (OWASP Top 10, secrets, auth/authz, dependency risk)
- Code quality (complexity, duplication)
- Performance issues (N+1, inefficient algorithms)
- Best practices (naming, documentation, error handling)
- Maintainability (coupling, testability)

Output: Code review report with:
- Files reviewed count
- Issues by severity (CRITICAL, HIGH, MEDIUM, LOW)
- Specific file:line locations
- Fix recommendations
- Approval recommendation (APPROVE / REQUEST CHANGES / COMMENT)"
)
```
</agent_delegation>

<external_model_consultation>
## External Model Consultation (Preferred)

The code-reviewer agent SHOULD consult Codex for cross-validation.

### Protocol
1. **Form your OWN review FIRST** - Complete the review independently
2. **Consult for validation** - Cross-check findings with Codex
3. **Critically evaluate** - Never blindly adopt external findings
4. **Graceful fallback** - Never block if tools unavailable

### When to Consult
- Security-sensitive code changes
- Complex architectural patterns
- Unfamiliar codebases or languages
- High-stakes production code

### When to Skip
- Simple refactoring
- Well-understood patterns
- Time-critical reviews
- Small, isolated changes

### Tool Usage
Before first MCP tool use, call `ToolSearch("mcp")` to discover deferred MCP tools.
Use `mcp__x__ask_codex` with `agent_role: "code-reviewer"`.
If ToolSearch finds no MCP tools, fall back to the `code-reviewer` agent.

**Note:** Codex calls can take up to 1 hour. Consider the review timeline before consulting.
</external_model_consultation>
</workflow>

<style>
<output_format>
## Output Format

```
CODE REVIEW REPORT
==================

Files Reviewed: 8
Total Issues: 15

Review Axes:
- Spec Compliance: pass
- Security: fail
- Code Quality: warn
- Performance: pass
- Maintainability: warn

CRITICAL (0)
-----------
(none)

HIGH (3)
--------
1. src/api/auth.ts:42
   Issue: User input not sanitized before SQL query
   Risk: SQL injection vulnerability
   Fix: Use parameterized queries or ORM

2. src/components/UserProfile.tsx:89
   Issue: Password displayed in plain text in logs
   Risk: Credential exposure
   Fix: Remove password from log statements

3. src/utils/validation.ts:15
   Issue: Email regex allows invalid formats
   Risk: Accepts malformed emails
   Fix: Use proven email validation library

MEDIUM (7)
----------
...

LOW (5)
-------
...

RECOMMENDATION: REQUEST CHANGES

Critical security issues must be addressed before merge.
```
</output_format>

<review_checklist>
## Review Checklist

The code-reviewer agent checks:

### Security
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs sanitized
- [ ] SQL/NoSQL injection prevention
- [ ] XSS prevention (escaped outputs)
- [ ] CSRF protection on state-changing operations
- [ ] Authentication/authorization properly enforced
- [ ] Dependency risk reviewed when relevant

### Code Quality
- [ ] Functions < 50 lines (guideline)
- [ ] Cyclomatic complexity < 10
- [ ] No deeply nested code (> 4 levels)
- [ ] No duplicate logic (DRY principle)
- [ ] Clear, descriptive naming

### Performance
- [ ] No N+1 query patterns
- [ ] Appropriate caching where applicable
- [ ] Efficient algorithms (avoid O(n²) when O(n) possible)
- [ ] No unnecessary re-renders (React/Vue)

### Best Practices
- [ ] Error handling present and appropriate
- [ ] Logging at appropriate levels
- [ ] Documentation for public APIs
- [ ] Tests for critical paths
- [ ] No commented-out code
</review_checklist>

<approval_criteria>
## Approval Criteria

**APPROVE** - No CRITICAL or HIGH issues, minor improvements only
**REQUEST CHANGES** - CRITICAL or HIGH issues present
**COMMENT** - Only LOW/MEDIUM issues, no blocking concerns
</approval_criteria>

<scenario_examples>
## Scenario Examples

**Good:** The user says `continue` after the workflow already has a clear next step. Continue the current branch of work instead of restarting or re-asking the same question.

**Good:** The user changes only the output shape or downstream delivery step (for example `make a PR`). Preserve earlier non-conflicting workflow constraints and apply the update locally.

**Bad:** The user says `continue`, and the workflow restarts discovery or stops before the missing verification/evidence is gathered.
</scenario_examples>

<use_with_other_skills>
## Use with Other Skills

**With Team:**
```
/team "review recent auth changes and report findings"
```
Includes coordinated review execution across specialized agents.

**With Ralph:**
```
/ralph code-review then fix all issues
```
Review code, get feedback, fix until approved.

**With Ultrawork:**
```
/ultrawork review all files in src/
```
Parallel code review across multiple files.
</use_with_other_skills>

<best_practices>
## Best Practices

- **Review early** - Catch issues before they compound
- **Review often** - Small, frequent reviews better than huge ones
- **Address CRITICAL/HIGH first** - Fix security and bugs immediately
- **Consider context** - Some "issues" may be intentional trade-offs
- **Learn from reviews** - Use feedback to improve coding practices
</best_practices>
</style>
</skill>
