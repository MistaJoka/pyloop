"""Step tracer: runs a snippet under sys.settrace and records what changed.

The output of trace() feeds the WATCH stage animation directly.

Read this before changing anything here:

- A `line` event fires BEFORE that line runs. So a step's locals are the state
  *going into* the line, and a line's effect shows up in the NEXT step. Get this
  backwards and the UI teaches the wrong causality.
- We do NOT deepcopy locals. _ser() calls repr() immediately, which materializes
  the value into a string right then — later mutation can't reach it. An earlier
  version deepcopied "to avoid aliasing"; it was pure cost and bought nothing.
- Nothing here may store cumulative stdout per step. That's O(n^2) and turned a
  few thousand prints into a ~90MB payload. Steps carry an offset; the caller
  slices.
"""
import sys, io, json, os, reprlib, shutil, tempfile, traceback

MAX_STEPS = 10000
FILENAME = "<snippet>"

# Truncates *while* building, so a 5000-element list is cheap. Plain repr()
# builds the whole string and only then gets sliced — that was quadratic on
# every step.
_repr = reprlib.Repr()
_repr.maxlist = 20
_repr.maxtuple = 20
_repr.maxdict = 12
_repr.maxset = 20
_repr.maxfrozenset = 20
_repr.maxdeque = 20
_repr.maxarray = 20
_repr.maxstring = 120
_repr.maxlong = 60
_repr.maxother = 200
_repr.maxlevel = 4


class _StepCap(BaseException):
    """BaseException on purpose.

    As an Exception, `try: ... except Exception: pass` in user code swallowed
    the cap. Python then disables tracing (the trace fn raised), so the loop ran
    on untraced and came back capped=False, error=None — a truncated trace
    reported as a complete one. Silent wrong output. Don't "tidy" this back to
    Exception.

    A bare `except:` still catches this — nothing in Python survives that. So
    the cap is ALSO recorded in a flag before raising (see _State), and that
    flag is what the result reports. Worst case the snippet runs on untraced,
    but we never claim the trace is complete when it isn't.
    """


class _Out(io.TextIOBase):
    """Collects stdout and tracks length in O(1).

    StringIO.getvalue() copies the whole buffer, so calling it per step was
    itself quadratic. Join once, at the end.
    """

    def __init__(self):
        self.parts = []
        self.n = 0

    def writable(self):
        return True

    def write(self, s):
        self.parts.append(s)
        self.n += len(s)
        return len(s)

    def value(self):
        return "".join(self.parts)


def _ser(v):
    try:
        r = _repr.repr(v)
    except Exception:
        r = "<unreprable>"
    return {"type": type(v).__name__, "repr": r}


def _snapshot(frame_locals):
    return {k: _ser(v) for k, v in frame_locals.items() if not k.startswith("__")}


def _depth(frame):
    """How many snippet frames are stacked below this one.

    0 = module level. 1 = inside a function called from the module. Without
    this, the UI shows a callee's locals as though the caller's variables simply
    vanished — which mis-teaches the one thing functions exist to teach.
    """
    d = 0
    f = frame.f_back
    while f is not None:
        if f.f_code.co_filename == FILENAME:
            d += 1
        f = f.f_back
    return d


def _guard():
    """A step cap for the UNTRACED paths (run_plain / run_with_asserts).

    Those paths had no cap and no timeout of their own. In the browser the 10s
    worker kill covers it, but verify-content runs in Node with no worker — so a
    single infinite `fix.brokenCode` would hang the build forever rather than
    fail it. This counts lines and nothing else (no snapshots), so it's cheap,
    and it turns a runaway into an instant honest message instead of a 10s stall.
    """
    state = {"n": 0, "capped": False}

    def counter(frame, event, arg):
        if frame.f_code.co_filename != FILENAME:
            return None
        if event == "line":
            state["n"] += 1
            if state["n"] > MAX_STEPS:
                state["capped"] = True
                raise _StepCap()
        return counter

    return state, counter


RUNAWAY = {
    "type": "Runaway",
    "msg": "That ran forever — it never stopped on its own. Check your loop's exit condition.",
    "line": None,
}


class _Sandbox:
    """A fresh working directory per run.

    Pyodide's filesystem is real and PERSISTENT for the life of the worker, so a
    file written by one snippet was still sitting there for the next one. That
    makes a files lesson lie: re-run an append and the output doubles; the very
    first `open(...)` for reading succeeds when it should raise. Each run gets
    its own empty directory and it's removed afterwards, so every run starts
    from nothing.
    """

    def __enter__(self):
        self.prev = os.getcwd()
        self.dir = tempfile.mkdtemp(prefix="pyloop-")
        os.chdir(self.dir)
        return self

    def __exit__(self, *exc):
        try:
            os.chdir(self.prev)
        except Exception:
            pass
        shutil.rmtree(self.dir, ignore_errors=True)
        return False


def _error_at(e, fallback_line=None):
    """Structured error with the line number, so the UI can point at it."""
    line = fallback_line
    if isinstance(e, SyntaxError) and e.lineno:
        line = e.lineno
    else:
        frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == FILENAME]
        if frames:
            line = frames[-1].lineno
    return {"type": type(e).__name__, "msg": str(e), "line": line}


def trace(code, stdin=""):
    steps = []
    out = _Out()
    # Records the cap OUTSIDE the exception system, so a bare `except:` in user
    # code can hide the raise but not the fact.
    state = {"capped": False}

    def tracefunc(frame, event, arg):
        if frame.f_code.co_filename != FILENAME:
            return None  # keep stdlib internals out of the trace
        if event in ("line", "return", "exception"):
            if len(steps) >= MAX_STEPS:
                state["capped"] = True
                raise _StepCap()
            steps.append({
                "line": frame.f_lineno,
                "event": event,
                "locals": _snapshot(frame.f_locals),
                "out": out.n,  # offset into stdout; caller slices
                "fn": frame.f_code.co_name,  # "<module>" at top level
                "depth": _depth(frame),
            })
        return tracefunc

    error = None
    try:
        compiled = compile(code, FILENAME, "exec")
    except SyntaxError as e:
        return json.dumps({"steps": [], "stdout": "", "error": _error_at(e), "capped": False})

    real_stdout, real_stdin = sys.stdout, sys.stdin
    sys.stdout, sys.stdin = out, io.StringIO(stdin)
    ns = {"__name__": "__main__"}
    try:
        with _Sandbox():
            sys.settrace(tracefunc)
            exec(compiled, ns)
    except _StepCap:
        pass  # expected; state["capped"] already records it
    except BaseException as e:
        error = _error_at(e)
    finally:
        sys.settrace(None)
        sys.stdout, sys.stdin = real_stdout, real_stdin

    return json.dumps({
        "steps": steps,
        "stdout": out.value(),
        # A capped run is not a successful one, whatever else happened.
        "error": None if state["capped"] else error,
        "capped": state["capped"],
    })


def run_plain(code, stdin=""):
    """Execute without tracing; used by the FIX stage."""
    out = _Out()
    real_stdout, real_stdin = sys.stdout, sys.stdin
    ns = {"__name__": "__main__"}
    error = None
    try:
        compiled = compile(code, FILENAME, "exec")
    except SyntaxError as e:
        return json.dumps({"stdout": "", "error": _error_at(e)})
    sys.stdout, sys.stdin = out, io.StringIO(stdin)
    state, counter = _guard()
    try:
        with _Sandbox():
            sys.settrace(counter)
            exec(compiled, ns)
    except _StepCap:
        pass
    except BaseException as e:
        error = _error_at(e)
    finally:
        sys.settrace(None)
        sys.stdout, sys.stdin = real_stdout, real_stdin
    if state["capped"]:
        error = RUNAWAY
    return json.dumps({"stdout": out.value(), "error": error})


def run_with_asserts(code, assert_code, stdin=""):
    """Run user code, then assertions against the resulting namespace.

    Assertions see three extras beyond the user's own variables:
      __stdout__  what the code printed
      __source__  the submitted source, for checks that care about *how* it was
                  written (e.g. "use a comprehension"). Parse it with ast —
                  never match on the text, or whitespace decides who passes.
    """
    out = _Out()
    real_stdout, real_stdin = sys.stdout, sys.stdin
    ns = {"__name__": "__main__"}
    error = None
    passed = False
    try:
        compiled = compile(code, FILENAME, "exec")
    except SyntaxError as e:
        return json.dumps({"passed": False, "stdout": "", "error": _error_at(e)})
    sys.stdout, sys.stdin = out, io.StringIO(stdin)
    state, counter = _guard()
    try:
        # Checks run inside the sandbox too, so an assertion can read a file the
        # submission just wrote — it's gone by the next run either way.
        with _Sandbox():
            sys.settrace(counter)
            exec(compiled, ns)
            sys.settrace(None)  # the checks themselves are ours; don't count them
            ns["__stdout__"] = out.value()
            ns["__source__"] = code
            exec(compile(assert_code, "<checks>", "exec"), ns)
            passed = True
    except _StepCap:
        pass
    except AssertionError as e:
        error = {"type": "AssertionError", "msg": str(e) or "That's not quite it yet.", "line": None}
    except BaseException as e:
        error = _error_at(e)
    finally:
        sys.settrace(None)
        sys.stdout, sys.stdin = real_stdout, real_stdin
    if state["capped"]:
        passed, error = False, RUNAWAY
    return json.dumps({"passed": passed, "stdout": out.value(), "error": error})
