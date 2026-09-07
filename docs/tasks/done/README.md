# Done tasks

Completed, tested, approved, and spec-updated tasks. Kept in the repo (not deleted) so future
sessions can look up how a milestone was actually delivered.

A task lands here when **all** of the following are true:

1. Implementation is merged.
2. Every test case listed in the task's "what done looks like" is passing.
3. The dry-run protocol (TESTSPEC §4) is signed off by a human reviewer.
4. The follow-up **spec update task** has been run: affected specs versioned, `Traces to:` lines
   updated, Spec Change Log entries appended.

Filename/number is preserved unchanged when moving from `../active/`. Update the task file's
`Status:` header to `Completed (YYYY-MM-DD — <one-line summary of the spec versions bumped>)`
before moving it.
