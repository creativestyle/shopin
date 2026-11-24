/**
 * Writes a run summary to the GitHub job summary ($GITHUB_STEP_SUMMARY):
 * counts per outcome, and every flaky, failed or not-run test by name, so a
 * test that passed only on retry is visible instead of looking green.
 */

import { appendFileSync } from 'node:fs'
import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter'

type Outcome = ReturnType<TestCase['outcome']>

const HEADINGS: Record<Outcome, string> = {
  flaky: 'Flaky (passed only on retry)',
  unexpected: 'Failed',
  skipped: 'Not run',
  expected: 'Passed',
}

export default class CiSummaryReporter implements Reporter {
  private readonly tests = new Map<TestCase, TestResult>()

  onTestEnd(test: TestCase, result: TestResult) {
    this.tests.set(test, result)
  }

  onEnd(result: FullResult) {
    const byOutcome = new Map<Outcome, TestCase[]>()
    for (const test of this.tests.keys()) {
      const outcome = test.outcome()
      byOutcome.set(outcome, [...(byOutcome.get(outcome) ?? []), test])
    }

    const title = (test: TestCase) =>
      test.titlePath().filter(Boolean).join(' › ')
    const skipReason = (test: TestCase) =>
      test.annotations.find((a) => a.type === 'skip')?.description

    const lines = [
      `## E2E: ${result.status}`,
      '',
      ...(['expected', 'flaky', 'unexpected', 'skipped'] as Outcome[]).map(
        (outcome) =>
          `- ${HEADINGS[outcome]}: ${byOutcome.get(outcome)?.length ?? 0}`
      ),
    ]
    for (const outcome of ['flaky', 'unexpected', 'skipped'] as Outcome[]) {
      const tests = byOutcome.get(outcome)
      if (!tests?.length) continue
      lines.push('', `### ${HEADINGS[outcome]}`, '')
      for (const test of tests) {
        const reason = outcome === 'skipped' ? skipReason(test) : undefined
        lines.push(`- ${title(test)}${reason ? ` — ${reason}` : ''}`)
      }
    }

    const summary = `${lines.join('\n')}\n`
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
    } else {
      console.log(summary)
    }
  }

  printsToStdio() {
    return !process.env.GITHUB_STEP_SUMMARY
  }
}
