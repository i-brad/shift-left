# 09 · CI

**Lessons:** Checks on pull requests · Reports and traces · Secrets · Parallel runs · **Time:** about 30 minutes

You'll write a GitHub Actions workflow for Kudi. There's no planted bug this time: `check.test.ts` holds the rules a good workflow meets, and `pnpm exercise 09-ci` checks your `workflow.yml` against them.

## Your task

1. `pnpm exercise 09-ci`. Read each red rule.
2. Fix `workflow.yml` one rule at a time:
   - run on `pull_request`
   - `pnpm install --frozen-lockfile`, and no `sleep`
   - a fast job (typecheck, unit, API) and a UI job that `needs` it, both with `timeout-minutes`
   - the UI job split into 2 shards with a `matrix` and `--shard=${{ matrix.shard }}/2`
   - upload `playwright-report` and `test-results` with `if: ${{ !cancelled() }}`
   - the staging password from `${{ secrets.STAGING_PASSWORD }}`
3. All green. To try it for real, copy it into a fork's `.github/workflows/` and open a pull request.

Reference: `pnpm exercise 09-ci --solution`.
