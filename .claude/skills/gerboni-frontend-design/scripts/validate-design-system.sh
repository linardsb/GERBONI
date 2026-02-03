#!/bin/bash
# Design System Validation Script
# Checks for design system violations in frontend component files

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Get the file path from argument or CLAUDE_FILE_PATH
FILE_PATH="${1:-$CLAUDE_FILE_PATH}"

# Exit if no file path
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Only check TypeScript/TSX files in frontend/src
if [[ ! "$FILE_PATH" =~ frontend/src.*\.(tsx?|jsx?)$ ]]; then
    exit 0
fi

# Skip test files
if [[ "$FILE_PATH" =~ \.(test|spec)\.(tsx?|jsx?)$ ]]; then
    exit 0
fi

VIOLATIONS=0
WARNINGS=0

echo ""
echo "🎨 Design System Validation: $FILE_PATH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for inline styles
if grep -qE 'style=\{' "$FILE_PATH" 2>/dev/null; then
    echo -e "${RED}❌ VIOLATION: Inline styles detected${NC}"
    echo "   Use Tailwind classes instead of style={{}}"
    grep -n 'style={' "$FILE_PATH" | head -3 | sed 's/^/   Line /'
    ((VIOLATIONS++))
fi

# Check for arbitrary gap values
if grep -qE 'gap-\[\d' "$FILE_PATH" 2>/dev/null; then
    echo -e "${RED}❌ VIOLATION: Arbitrary gap value detected${NC}"
    echo "   Use semantic tokens: gap-element, gap-group, gap-section, gap-page"
    grep -n 'gap-\[' "$FILE_PATH" | head -3 | sed 's/^/   Line /'
    ((VIOLATIONS++))
fi

# Check for arbitrary padding
if grep -qE 'p[xytblr]?-\[\d' "$FILE_PATH" 2>/dev/null; then
    echo -e "${RED}❌ VIOLATION: Arbitrary padding detected${NC}"
    echo "   Use component padding props or standard Tailwind classes"
    grep -nE 'p[xytblr]?-\[' "$FILE_PATH" | head -3 | sed 's/^/   Line /'
    ((VIOLATIONS++))
fi

# Check for arbitrary margin
if grep -qE 'm[xytblr]?-\[\d' "$FILE_PATH" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: Arbitrary margin detected${NC}"
    echo "   Consider using spacing tokens or layout components"
    grep -nE 'm[xytblr]?-\[' "$FILE_PATH" | head -3 | sed 's/^/   Line /'
    ((WARNINGS++))
fi

# Check for hex colors
if grep -qE '#[0-9a-fA-F]{3,6}[^0-9a-fA-F]' "$FILE_PATH" 2>/dev/null; then
    echo -e "${RED}❌ VIOLATION: Hardcoded hex color detected${NC}"
    echo "   Use semantic color tokens: bg-primary, text-foreground, etc."
    grep -nE '#[0-9a-fA-F]{3,6}' "$FILE_PATH" | head -3 | sed 's/^/   Line /'
    ((VIOLATIONS++))
fi

# Check for rgb/rgba/hsl colors
if grep -qE 'rgb\(|rgba\(|hsl\(|hsla\(' "$FILE_PATH" 2>/dev/null; then
    echo -e "${RED}❌ VIOLATION: Hardcoded color function detected${NC}"
    echo "   Use semantic color tokens instead"
    grep -nE 'rgb\(|rgba\(|hsl\(' "$FILE_PATH" | head -3 | sed 's/^/   Line /'
    ((VIOLATIONS++))
fi

# Check for missing data-slot in component definitions
if grep -qE 'function [A-Z]|const [A-Z].*= \(' "$FILE_PATH" 2>/dev/null; then
    if ! grep -q 'data-slot=' "$FILE_PATH" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  WARNING: No data-slot attribute found${NC}"
        echo "   Components should include data-slot for debugging"
        ((WARNINGS++))
    fi
fi

# Check for className without cn()
if grep -qE 'className=\{`' "$FILE_PATH" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: Template literal className without cn()${NC}"
    echo "   Use cn() from @/lib/utils for class merging"
    grep -n 'className={`' "$FILE_PATH" | head -3 | sed 's/^/   Line /'
    ((WARNINGS++))
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $VIOLATIONS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ No design system violations found${NC}"
else
    if [ $VIOLATIONS -gt 0 ]; then
        echo -e "${RED}Found $VIOLATIONS violation(s)${NC}"
    fi
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Found $WARNINGS warning(s)${NC}"
    fi
fi
echo ""

# Exit with error code if violations found (not warnings)
exit $VIOLATIONS
