# Anonymous Hello

Status: Deferred

## Purpose

Filegap currently uses public, aggregate Homebrew installation events and GitHub
release download counts as adoption signals. These numbers cannot show whether
someone opened the desktop app and completed a local workflow.

The deferred anonymous hello is intended to answer only this high-level product
question:

> Did someone voluntarily tell us that Filegap Desktop is being used?

It is not intended to measure active users, retention, feature usage, files, or
workflow behavior.

## Product Decision

Do not show a telemetry permission prompt when the app first opens.

After the first successful desktop operation has fully completed, show a
one-time, non-blocking invitation to send an anonymous hello. The network
request must only start after a separate, explicit user action and must never
run inside a PDF-processing path.

Declining or dismissing the invitation must store that choice locally and
prevent the invitation from appearing again.

## Approved Copy

**Help us know Filegap is being used**

Filegap doesn't track how you use the app or collect any information about your
PDFs.

If you'd like, you can send us a one-time anonymous hello. It contains no
identifier, file data, or usage information.

You won't be asked again.

Actions:

- `No, thanks`
- `Send anonymous hello`

The two actions should have comparable visual prominence. The experience must
not use a preselected choice or a consent dark pattern.

## Privacy Contract

Any future implementation must satisfy all of these requirements:

- The hello is sent only after explicit opt-in.
- The request is sent once.
- The request contains no installation, device, or user identifier.
- The request contains no cookies.
- The request contains no app version, operating system, architecture, locale,
  distribution channel, or other segmentation metadata.
- The request contains no PDF data, filename, path, size, page count, page
  range, content, extracted text, operation name, or workflow information.
- The retained server-side data is an aggregate counter only.
- Infrastructure and application logging for the endpoint must not retain IP
  addresses, user agents, request bodies, or other connection metadata.
- The request is not sent while a PDF operation is running.
- A failed request is not retried later without another explicit user action.
- Declining, dismissing, success, and failure states are stored only locally.

The planned event name is `desktop_hello`. It must have no payload.

## Expected Local State

Use a small explicit state machine rather than an installation identifier:

- `unseen`: the invitation has not been decided.
- `declined`: the user declined or dismissed it; do not ask again.
- `sent`: the anonymous hello was accepted and sent successfully; do not send
  again.

If sending fails, show a generic failure message and allow the user to retry
only from the visible invitation. Do not queue a background retry.

## Deferred Technical Decisions

Before implementation:

1. Select an endpoint that can increment an aggregate counter without retaining
   request-level data.
2. Verify infrastructure logging behavior, not only application logging.
3. Document the endpoint and data lifecycle in the privacy policy.
4. Confirm desktop network permissions and content-security restrictions remain
   limited to this fixed endpoint.
5. Add tests proving that no request occurs before opt-in, during processing,
   after decline, or more than once after success.
6. Perform privacy and security reviews before enabling the endpoint.

Do not implement the UI, endpoint, network permission, or desktop event until
these decisions and reviews are complete.
