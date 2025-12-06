# Implementation Prompt: Dark Mode for NAM Conference Survey

## Story Reference
**Story ID**: STORY-047
**Story File**: [story-047-dark-mode.md](story-047-dark-mode.md)
**Priority**: High
**Iteration**: 2025-12-02-dark-mode

## Objective
Implement a complete dark mode feature for the NAM Conference Survey application that:
- Auto-detects system preference on first visit
- Provides a visible toggle button on every page
- Persists user preference via long-lived cookie
- Works across the entire application (survey, admin dashboard, all pages)
- Maintains Equal Experts brand colors with proper contrast adjustments
- Provides instant theme switching without animations (MVP scope)

## Implementation Requirements

### 1. Theme Infrastructure (Mantine v7)

**Create Dark Theme Definition**
- Location: `apps/frontend/src/theme/theme.ts`
- Extend the existing Mantine theme to support `colorScheme: 'dark'`
- Mantine v7 uses CSS variables for theming - leverage this for seamless switching
- Maintain Equal Experts brand colors with adjusted shades for dark mode:
  - Primary Blue: `#1795d4` (may need brightness adjustment for dark backgrounds)
  - Navy: `#22567c` (use lighter shades from the palette)
  - Charcoal: `#2c3234` (works well as dark mode accent)
  - Dark background: Use `#1a1b1e` or similar dark gray (NOT pure black)
  - Text on dark: Use `#c1c2c5` or `#fff` for primary text
  - Borders on dark: Subtle borders using `#373A40` or similar

**Key Theme Adjustments for Dark Mode**:
```typescript
// Suggested dark mode color overrides
{
  colorScheme: 'dark',
  colors: {
    dark: [
      '#C1C2C5', // 0 - text
      '#A6A7AB', // 1 - dimmed text
      '#909296', // 2 - borders
      '#5c5f66', // 3 - placeholder
      '#373A40', // 4 - hover
      '#2C2E33', // 5 - inputs
      '#25262b', // 6 - cards
      '#1A1B1E', // 7 - app background
      '#141517', // 8 - darker
      '#101113', // 9 - darkest
    ],
  },
  // Ensure Equal Experts colors work on dark backgrounds
  // May need to use lighter shades (index 3-4) instead of base color
}
```

### 2. Color Scheme Management

**Create Theme Context/Hook**
- Location: `apps/frontend/src/theme/ThemeProvider.tsx` or `apps/frontend/src/hooks/useColorScheme.ts`
- Implement color scheme state management using `@mantine/hooks` `useLocalStorage` or custom cookie hook (not `useColorScheme` from Mantine)
- Functions needed:
  - `getSystemPreference()`: Detect `prefers-color-scheme` media query
  - `getStoredPreference()`: Read from cookie
  - `setStoredPreference(scheme)`: Write to cookie (long-lived, e.g., 365 days)
  - `toggleColorScheme()`: Switch between light/dark
  - Initial state logic: cookie value → system preference → 'light' (default)

**System Preference Detection**:
```typescript
const getSystemPreference = (): 'light' | 'dark' => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

### 3. Update MantineProvider

**Modify**: `apps/frontend/src/main.tsx`
- Wrap MantineProvider with color scheme state
- Pass dynamic `theme` with current `colorScheme` to MantineProvider
- Ensure no FOUC (Flash of Unstyled Content) by loading preference before render

### 4. Theme Toggle Button Component

**Create**: `apps/frontend/src/components/ThemeToggle.tsx`
- Use `@tabler/icons-react` for icons: `IconSun`, `IconMoon`
- Should be an ActionIcon or UnstyledButton with clear visual indication
- Include ARIA labels for accessibility:
  - `aria-label="Toggle color scheme"`
  - Announce state changes to screen readers
- Keyboard accessible (Enter/Space to toggle)
- Visible indicator of current theme
- Instant switching (no animation/transition for MVP)

**Placement**:
- Add to all pages: SurveyPage, ThankYouPage, AdminDashboardPage
- Position: Top-right corner or header (consistent across all pages)
- Always visible, not hidden in menu (per requirements)

### 5. Prevent FOUC (Flash of Unstyled Content)

**Critical**: Theme must be applied BEFORE first render
- Read cookie in a blocking script in `index.html` OR
- Use inline script to set color-scheme CSS property on `<html>` tag
- Alternatively, use Mantine's built-in `ColorSchemeScript` component (Mantine v7)

### 6. Component-Specific Dark Mode Adjustments

Review all components and ensure they work in dark mode. Pay special attention to:

**Question Components**:
- `LikertQuestion.tsx`: Radio buttons, labels, scales
- `LikertWithNAQuestion.tsx`: N/A option styling
- `MultipleSelectQuestion.tsx`: Checkboxes, selected states
- `SingleChoiceQuestion.tsx`: Radio buttons
- `RankingQuestion.tsx`: Drag indicators, ranking numbers
- `OpenEndedQuestion.tsx`: Textarea backgrounds
- `TextFieldQuestion.tsx`: Input backgrounds

**Common Patterns to Check**:
- Hardcoded colors (e.g., `color: '#000'`) - Replace with theme tokens
- Background colors on inputs, cards, containers
- Border colors - use `theme.colors.dark[4]` for dark mode
- Text contrast - ensure WCAG AA compliance
- Focus indicators - must be visible on dark backgrounds
- Disabled states - sufficient contrast
- Hover states - appropriate for dark backgrounds

**Admin Dashboard** (`AdminDashboardPage.tsx`):
- MetricCard backgrounds and borders
- RecentResponsesSection table styling
- Chart colors (if any visualizations)

### 7. Testing Requirements

**Browser Testing**:
- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- Edge (latest)

**Scenarios to Test**:
1. First visit with system dark mode → should load in dark
2. First visit with system light mode → should load in light
3. Toggle from light to dark → preference saved in cookie
4. Refresh page → theme persists
5. Navigate between pages → theme persists, toggle visible on all pages
6. Clear cookies → reverts to system preference
7. Keyboard navigation → toggle is accessible via Tab, activates with Enter/Space

**Accessibility Checks**:
- None

### 8. Cookie Implementation Details

**Cookie Specification**:
- **Name**: `nam-survey-color-scheme`
- **Value**: `light` | `dark`
- **Path**: `/` (available across all pages)
- **Max-Age**: `31536000` (1 year = 365 days)
- **SameSite**: `Lax` (prevents CSRF while allowing normal navigation)
- **Secure**: `true` in production (HTTPS only)
- **HttpOnly**: `false` (needs to be readable by JavaScript)

## Out of Scope (Do NOT Implement)

- ❌ Smooth transition animations between themes
- ❌ Custom color themes beyond light/dark
- ❌ Per-question or per-component theme customization
- ❌ "Auto" mode that continuously follows system preference (set once on first load, then manual only)
- ❌ Theme preview or theme settings page
- ❌ Separate admin vs survey theme preferences
- ❌ Theme analytics/tracking (not defined in requirements)
## Acceptance Criteria Reference

From STORY-047, the implementation MUST satisfy:

**Functional**:
1. Auto-detect system preference on first visit ✓
2. Manual toggle switches theme instantly ✓
3. Preference persists via cookie across sessions ✓
4. No FOUC (flash of light theme when dark is preferred) ✓

**Non-Functional**:
1. WCAG AA contrast ratios for all text ✓
2. Focus indicators visible in dark mode ✓
3. Instant switching (no layout shift) ✓
4. Toggle is keyboard accessible and screen reader friendly ✓

**Quality**:
1. Works in Chrome, Safari, Firefox, Edge ✓
2. All UI components function correctly in both modes ✓

## Technical Stack Reference

- **Frontend Framework**: React 18 + TypeScript
- **UI Library**: Mantine v7.4.1 (CSS-in-JS with CSS variables)
- **Routing**: React Router v6
- **Icons**: @tabler/icons-react
- **Build Tool**: Vite
- **State Management**: React hooks (no Redux/Context needed beyond theme)
- **Cookie Library**: js-cookie (to be installed)

## File Structure

```
apps/frontend/src/
├── theme/
│   ├── theme.ts (MODIFY: add dark color scheme)
│   └── ThemeProvider.tsx (CREATE: optional, if using context)
├── hooks/
│   └── useColorScheme.ts (CREATE: color scheme hook)
├── components/
│   ├── ThemeToggle.tsx (CREATE: toggle button component)
│   ├── questions/ (REVIEW & UPDATE: ensure dark mode compatibility)
│   │   ├── LikertQuestion.tsx
│   │   ├── MultipleSelectQuestion.tsx
│   │   ├── RankingQuestion.tsx
│   │   └── ... (all question types)
│   ├── MetricCard.tsx (REVIEW: admin dashboard)
│   └── RecentResponsesSection.tsx (REVIEW: admin dashboard)
├── pages/ (UPDATE: add ThemeToggle to all pages)
│   ├── SurveyPage.tsx
│   ├── ThankYouPage.tsx
│   └── AdminDashboardPage.tsx
├── main.tsx (MODIFY: wrap with color scheme provider)
├── App.tsx (REVIEW: may need context consumer)
└── utils/ (OPTIONAL: create if needed)
    └── cookies.ts (CREATE: cookie helper functions)
```

## Color Palette Reference

**Light Mode (Current)**:
- Primary: `#1795d4` (Equal Experts Blue)
- Navy: `#22567c`
- Charcoal: `#2c3234`
- Background: `#ffffff`
- Text: `#000000` / dark grays
- Card borders: `#e0e0e0`

**Dark Mode (To Implement)**:
- Primary: `#1795d4` (may lighten to `#4db5e6` for better contrast)
- Navy: Use lighter shade `#5690b9` or `#7ba8c8`
- Charcoal: Can remain `#2c3234` or use as accent
- Background: `#1a1b1e` (dark gray, not pure black)
- Text: `#c1c2c5` (light gray)
- Card backgrounds: `#25262b`
- Card borders: `#373A40`
- Input backgrounds: `#2C2E33`

## Success Metrics

While not tracked in MVP, successful implementation means:
- No user reports of FOUC
- Theme persists correctly across sessions
- No accessibility violations in dark mode
- All components remain functional and readable
- Toggle is easily discoverable and intuitive

## Additional Notes

1. **Mantine v7 Specifics**: Mantine v7 uses CSS variables extensively. The `colorScheme` prop automatically swaps CSS variable values. You may not need to manually override every component.

2. **Logo Handling**: The Equal Experts logo is currently a URL. Check if there's a dark variant. If not, you may need to invert or adjust logo in dark mode (CSS filter or separate asset).

3. **Form Validation States**: Ensure error states (red), success states (green), and warning states (yellow) have sufficient contrast in dark mode.

4. **Hover/Active States**: Mantine provides these automatically, but verify they're visible in dark mode.

5. **Third-Party Components**: If any charts or external components are used in admin dashboard, they may need separate dark mode configuration.

6. **Backend Consideration**: The backend doesn't need changes. Dark mode is purely frontend (cookie is client-side only, not sent to backend for processing).

## Questions for Developer

Before implementation, consider:
- Should we add a "System" option that always follows OS preference? (Currently out of scope)
- Do we want to track dark mode adoption in analytics? (Currently not specified)
- Should we provide a dark variant of the Equal Experts logo, or use CSS filter? (Check with design team)

## Resources

- [Mantine Dark Theme Documentation](https://mantine.dev/theming/dark-theme/)
- [MDN: prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [js-cookie Documentation](https://github.com/js-cookie/js-cookie)

---
