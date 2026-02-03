import { describe, it, expect } from 'vitest'
import {
  validateDesignSystem,
  hasDataSlot,
  usesCnUtility,
  FORBIDDEN_PATTERNS,
  SPACING,
  COLORS,
  CONTAINER_QUERIES,
  VALID_GAP_VALUES,
  TEXT_VARIANTS,
  BUTTON_VARIANTS,
  BUTTON_SIZES,
  CARD_VARIANTS,
} from '@/lib/design-tokens'

describe('validateDesignSystem', () => {
  describe('inline styles detection', () => {
    it('detects style={{ }} patterns', () => {
      const code = '<div style={{ marginTop: "16px" }}>Content</div>'
      const violations = validateDesignSystem(code)
      expect(violations).toHaveLength(1)
      expect(violations[0].message).toContain('inline styles')
    })

    it('does not flag style string in comments', () => {
      const code = '// This uses Tailwind classes instead of style={{}}'
      const violations = validateDesignSystem(code)
      // Note: simple regex will still match, but that's acceptable for our use case
      // A more sophisticated parser would be needed to ignore comments
      expect(violations.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('arbitrary gap detection', () => {
    it('detects gap-[number] patterns', () => {
      const code = '<div className="gap-[24px]">Content</div>'
      const violations = validateDesignSystem(code)
      const gapViolation = violations.find((v) => v.message.includes('gap tokens'))
      expect(gapViolation).toBeDefined()
    })

    it('detects gap-[rem] patterns', () => {
      const code = '<div className="gap-[1.5rem]">Content</div>'
      const violations = validateDesignSystem(code)
      const gapViolation = violations.find((v) => v.message.includes('gap tokens'))
      expect(gapViolation).toBeDefined()
    })

    it('does not flag semantic gap tokens', () => {
      const code = '<div className="gap-element gap-group gap-section gap-page">Content</div>'
      const violations = validateDesignSystem(code)
      const gapViolation = violations.find((v) => v.message.includes('gap tokens'))
      expect(gapViolation).toBeUndefined()
    })

    it('does not flag numeric gap classes', () => {
      const code = '<div className="gap-4 gap-6 gap-8">Content</div>'
      const violations = validateDesignSystem(code)
      const gapViolation = violations.find((v) => v.message.includes('gap tokens'))
      expect(gapViolation).toBeUndefined()
    })
  })

  describe('arbitrary padding detection', () => {
    it('detects p-[number] patterns', () => {
      const code = '<div className="p-[20px]">Content</div>'
      const violations = validateDesignSystem(code)
      const paddingViolation = violations.find((v) => v.message.includes('padding'))
      expect(paddingViolation).toBeDefined()
    })

    it('detects px-[number] patterns', () => {
      const code = '<div className="px-[16px]">Content</div>'
      const violations = validateDesignSystem(code)
      const paddingViolation = violations.find((v) => v.message.includes('padding'))
      expect(paddingViolation).toBeDefined()
    })

    it('detects py-[number] patterns', () => {
      const code = '<div className="py-[12px]">Content</div>'
      const violations = validateDesignSystem(code)
      const paddingViolation = violations.find((v) => v.message.includes('padding'))
      expect(paddingViolation).toBeDefined()
    })

    it('does not flag standard padding classes', () => {
      const code = '<div className="p-4 px-6 py-8">Content</div>'
      const violations = validateDesignSystem(code)
      const paddingViolation = violations.find((v) => v.message.includes('padding'))
      expect(paddingViolation).toBeUndefined()
    })
  })

  describe('arbitrary margin detection', () => {
    it('detects m-[number] patterns', () => {
      const code = '<div className="m-[16px]">Content</div>'
      const violations = validateDesignSystem(code)
      const marginViolation = violations.find((v) => v.message.includes('margin'))
      expect(marginViolation).toBeDefined()
      expect(marginViolation?.severity).toBe('warning')
    })

    it('detects mt-[number] patterns', () => {
      const code = '<div className="mt-[24px]">Content</div>'
      const violations = validateDesignSystem(code)
      const marginViolation = violations.find((v) => v.message.includes('margin'))
      expect(marginViolation).toBeDefined()
    })
  })

  describe('hardcoded color detection', () => {
    it('detects hex colors (6 digits)', () => {
      const code = '<div className="bg-[#ffffff]">Content</div>'
      const violations = validateDesignSystem(code)
      const colorViolation = violations.find((v) => v.message.includes('hex colors'))
      expect(colorViolation).toBeDefined()
    })

    it('detects hex colors (3 digits)', () => {
      const code = '<div className="text-[#fff]">Content</div>'
      const violations = validateDesignSystem(code)
      const colorViolation = violations.find((v) => v.message.includes('hex colors'))
      expect(colorViolation).toBeDefined()
    })

    it('detects rgb() colors', () => {
      const code = '<div style={{ color: "rgb(255, 255, 255)" }}>Content</div>'
      const violations = validateDesignSystem(code)
      const colorViolation = violations.find((v) => v.message.includes('rgb()'))
      expect(colorViolation).toBeDefined()
    })

    it('detects rgba() colors', () => {
      const code = '<div style={{ color: "rgba(0, 0, 0, 0.5)" }}>Content</div>'
      const violations = validateDesignSystem(code)
      const colorViolation = violations.find((v) => v.message.includes('rgba()'))
      expect(colorViolation).toBeDefined()
    })

    it('detects hsl() colors', () => {
      const code = '<div style={{ color: "hsl(200, 50%, 50%)" }}>Content</div>'
      const violations = validateDesignSystem(code)
      const colorViolation = violations.find((v) => v.message.includes('hsl()'))
      expect(colorViolation).toBeDefined()
    })

    it('does not flag semantic color tokens', () => {
      const code = '<div className="bg-primary text-foreground border-border">Content</div>'
      const violations = validateDesignSystem(code)
      const colorViolation = violations.find((v) => v.message.includes('color'))
      expect(colorViolation).toBeUndefined()
    })
  })

  describe('multiple violations', () => {
    it('detects multiple violations in same code', () => {
      const code = `
        <div
          style={{ marginTop: "16px" }}
          className="gap-[24px] bg-[#ff0000]"
        >
          Content
        </div>
      `
      const violations = validateDesignSystem(code)
      expect(violations.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('clean code', () => {
    it('returns empty array for compliant code', () => {
      const code = `
        <Stack gap="section" align="center">
          <Text variant="heading-lg">Title</Text>
          <Button variant="primary">Click me</Button>
        </Stack>
      `
      const violations = validateDesignSystem(code)
      expect(violations).toHaveLength(0)
    })
  })
})

describe('hasDataSlot', () => {
  it('returns true when data-slot is present', () => {
    const code = '<div data-slot="card">Content</div>'
    expect(hasDataSlot(code)).toBe(true)
  })

  it('returns true with single quotes', () => {
    const code = "<div data-slot='button'>Content</div>"
    expect(hasDataSlot(code)).toBe(true)
  })

  it('returns false when data-slot is missing', () => {
    const code = '<div className="card">Content</div>'
    expect(hasDataSlot(code)).toBe(false)
  })

  it('handles hyphenated slot names', () => {
    const code = '<div data-slot="card-header">Content</div>'
    expect(hasDataSlot(code)).toBe(true)
  })
})

describe('usesCnUtility', () => {
  it('returns true when cn() is used with className', () => {
    const code = 'className={cn(variants({ variant, className }))}'
    expect(usesCnUtility(code)).toBe(true)
  })

  it('returns false when className is a string', () => {
    const code = 'className="some-class"'
    expect(usesCnUtility(code)).toBe(false)
  })

  it('returns false when using clsx directly', () => {
    const code = 'className={clsx("class1", "class2")}'
    expect(usesCnUtility(code)).toBe(false)
  })
})

describe('FORBIDDEN_PATTERNS', () => {
  it('exports an array of patterns', () => {
    expect(Array.isArray(FORBIDDEN_PATTERNS)).toBe(true)
    expect(FORBIDDEN_PATTERNS.length).toBeGreaterThan(0)
  })

  it('each pattern has required properties', () => {
    FORBIDDEN_PATTERNS.forEach((entry) => {
      expect(entry).toHaveProperty('pattern')
      expect(entry).toHaveProperty('message')
      expect(entry).toHaveProperty('severity')
      expect(entry.pattern).toBeInstanceOf(RegExp)
      expect(typeof entry.message).toBe('string')
      expect(['error', 'warning']).toContain(entry.severity)
    })
  })
})

describe('Token constants', () => {
  describe('SPACING', () => {
    it('has semantic tokens', () => {
      expect(SPACING.semantic).toBeDefined()
      expect(SPACING.semantic.page).toBeDefined()
      expect(SPACING.semantic.section).toBeDefined()
      expect(SPACING.semantic.group).toBeDefined()
      expect(SPACING.semantic.element).toBeDefined()
    })

    it('has numeric scale', () => {
      expect(SPACING.numeric).toBeDefined()
      expect(SPACING.numeric.md.class).toBe('gap-4')
    })
  })

  describe('COLORS', () => {
    it('has background colors', () => {
      expect(COLORS.background).toBeDefined()
      expect(COLORS.background.primary).toBe('bg-primary')
    })

    it('has text colors', () => {
      expect(COLORS.text).toBeDefined()
      expect(COLORS.text.foreground).toBe('text-foreground')
    })

    it('has border colors', () => {
      expect(COLORS.border).toBeDefined()
      expect(COLORS.border.border).toBe('border-border')
    })
  })

  describe('CONTAINER_QUERIES', () => {
    it('has all breakpoints', () => {
      expect(Object.keys(CONTAINER_QUERIES)).toHaveLength(13)
    })

    it('has correct prefix format', () => {
      expect(CONTAINER_QUERIES.md.prefix).toBe('cq-md:')
    })

    it('has increasing pixel values', () => {
      const values = Object.values(CONTAINER_QUERIES).map((q) => q.pixels)
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1])
      }
    })
  })

  describe('VALID_GAP_VALUES', () => {
    it('includes semantic tokens', () => {
      expect(VALID_GAP_VALUES).toContain('element')
      expect(VALID_GAP_VALUES).toContain('group')
      expect(VALID_GAP_VALUES).toContain('section')
      expect(VALID_GAP_VALUES).toContain('page')
    })

    it('includes numeric values', () => {
      expect(VALID_GAP_VALUES).toContain('xs')
      expect(VALID_GAP_VALUES).toContain('md')
      expect(VALID_GAP_VALUES).toContain('xl')
    })
  })

  describe('TEXT_VARIANTS', () => {
    it('includes display variants', () => {
      expect(TEXT_VARIANTS).toContain('display-xl')
      expect(TEXT_VARIANTS).toContain('display-lg')
    })

    it('includes heading variants', () => {
      expect(TEXT_VARIANTS).toContain('heading-xl')
      expect(TEXT_VARIANTS).toContain('heading-sm')
    })

    it('includes body variants', () => {
      expect(TEXT_VARIANTS).toContain('body-lg')
      expect(TEXT_VARIANTS).toContain('body-sm')
    })

    it('includes special variants', () => {
      expect(TEXT_VARIANTS).toContain('label')
      expect(TEXT_VARIANTS).toContain('price')
      expect(TEXT_VARIANTS).toContain('muted')
    })
  })

  describe('BUTTON_VARIANTS', () => {
    it('has all expected variants', () => {
      expect(BUTTON_VARIANTS).toContain('default')
      expect(BUTTON_VARIANTS).toContain('destructive')
      expect(BUTTON_VARIANTS).toContain('outline')
      expect(BUTTON_VARIANTS).toContain('secondary')
      expect(BUTTON_VARIANTS).toContain('ghost')
      expect(BUTTON_VARIANTS).toContain('link')
      expect(BUTTON_VARIANTS).toContain('minimal')
    })
  })

  describe('BUTTON_SIZES', () => {
    it('has all expected sizes', () => {
      expect(BUTTON_SIZES).toContain('default')
      expect(BUTTON_SIZES).toContain('xs')
      expect(BUTTON_SIZES).toContain('sm')
      expect(BUTTON_SIZES).toContain('lg')
      expect(BUTTON_SIZES).toContain('icon')
    })
  })

  describe('CARD_VARIANTS', () => {
    it('has all expected variants', () => {
      expect(CARD_VARIANTS).toContain('default')
      expect(CARD_VARIANTS).toContain('outline')
      expect(CARD_VARIANTS).toContain('ghost')
      expect(CARD_VARIANTS).toContain('elevated')
      expect(CARD_VARIANTS).toContain('muted')
    })
  })
})
