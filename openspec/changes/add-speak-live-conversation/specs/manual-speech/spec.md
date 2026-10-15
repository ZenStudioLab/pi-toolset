# Spec Delta

## MODIFIED Requirements

### Requirement: Speech occurs only on explicit request

The extension SHALL start translation, speech generation, summarization, or playback only as the direct result of the user running a `/speak` subcommand that produces speech, or, while the user has live mode on, of the model calling the `speak_aloud` tool or of an agent run ending, whose answer is then read aloud, as the `voice-conversation` capability defines. Loading, reloading, session start, ordinary prompts, execution of any tool other than `speak_aloud` in live mode, agent completion while live mode is off, and any other lifecycle event SHALL NOT initiate a provider request, a model call, or playback. Lifecycle events MAY cancel or clean up this extension's own work.

#### Scenario: Silent startup and agent activity

- **WHEN** Pi starts or reloads with the extension loaded, and the user then submits prompts that complete with assistant answers and tool calls
- **THEN** no ElevenLabs request is made, no model call is made by the extension, and no audio is played

#### Scenario: Missing configuration does not block Pi

- **WHEN** the configuration file or API key is absent at startup
- **THEN** Pi starts normally and the problem is reported only when the user runs `/speak` or `/speak status`

#### Scenario: Speech without live mode

- **WHEN** live mode is off and an agent run completes with an answer
- **THEN** nothing is synthesized or played until the user runs a `/speak` subcommand that produces speech

### Requirement: Single job and responsive stop

The extension SHALL allow at most one speech job per Pi process; a second speak request while a job is active SHALL be rejected with a message and SHALL NOT queue or start another provider request. Live-mode updates from the `speak_aloud` tool, and the parts of an answer read aloud, are the one exception: they wait in order behind the update being spoken, as the `voice-conversation` capability defines, and `/speak` requests that produce speech are refused while live mode is on. The `/speak` handler SHALL return control to Pi promptly after starting the job rather than waiting for playback to finish, so that `/speak stop` can run during generation and during playback. `/speak stop` SHALL cancel only this extension's in-flight generation and terminate only its own tracked player process, and SHALL NOT abort the coding agent or affect other audio processes; while live mode is on it SHALL also drop every waiting live update. A cancelled job SHALL NOT later start playback or alter the state of a newer job.

#### Scenario: Stop during generation

- **WHEN** a synthesis request is in flight and the user runs `/speak stop`
- **THEN** the request is aborted, no playback starts when the cancelled request would have completed, no partial or temporary audio remains in the cache, and the coding agent is not aborted

#### Scenario: Stop during playback

- **WHEN** audio is playing and the user runs `/speak stop`
- **THEN** only the extension's player process ends and unrelated audio continues

#### Scenario: Duplicate request

- **WHEN** a job is active and the user runs `/speak` again
- **THEN** the extension reports that speech is already active and starts no second job

#### Scenario: Stop during live mode

- **WHEN** live mode is on, an update is playing, another is waiting, and the user runs `/speak stop`
- **THEN** playback ends, the waiting update is dropped, and live mode stays on
