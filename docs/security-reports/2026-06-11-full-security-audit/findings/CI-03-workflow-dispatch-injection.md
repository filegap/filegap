# CI-03 — `workflow_dispatch` tag input injected into `GITHUB_OUTPUT`

- **Severity:** High
- **Category:** CI Injection
- **Location:** `.github/workflows/release-desktop-community.yml:70-71`

## Description
The `workflow_dispatch` input `tag` is interpolated with `${{ github.event.inputs.tag }}` directly inside a `run:` bash block that writes to `GITHUB_OUTPUT`. A user able to trigger the workflow who supplies a tag containing a newline (`%0a`) or the literal `value=x\n` can inject arbitrary key-value pairs into `GITHUB_OUTPUT`, overriding outputs read by later steps — including `steps.release_tag.outputs.value` or `steps.cask_meta.outputs.*`, which feed the Homebrew cask `url` and `sha256`.

## Impact
Anyone with repo write access (able to trigger `workflow_dispatch`) could inject a malicious URL or fake SHA256 into the published Homebrew cask, leading to arbitrary code execution on every user who runs `brew upgrade`.

## Evidence
```yaml
- name: Resolve release tag
  id: release_tag
  shell: bash
  run: |
    if [ -n "${{ github.event.inputs.tag || '' }}" ]; then
      echo "value=${{ github.event.inputs.tag }}" >> "$GITHUB_OUTPUT"   # injection point
    else
      echo "value=${GITHUB_REF_NAME}" >> "$GITHUB_OUTPUT"
    fi
```

## Remediation
Pass the input via an environment variable and validate format before use — never expand it directly in the `run:` body:
```yaml
env:
  INPUT_TAG: ${{ github.event.inputs.tag }}
run: |
  if [[ ! "${INPUT_TAG}" =~ ^desktop-v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Invalid tag format: ${INPUT_TAG}" >&2; exit 1
  fi
  echo "value=${INPUT_TAG}" >> "${GITHUB_OUTPUT}"
```
