import shutil
import subprocess

SANDBOX = "tmp/sandbox"
shutil.rmtree(SANDBOX, ignore_errors=True)
for item in ("src", ".claude"):          # усе, що потрібно агенту для задачі
    shutil.copytree(item, f"{SANDBOX}/{item}")

git = ["git", "-C", SANDBOX,
       "-c", "user.email=evals@example.com", "-c", "user.name=evals",
       "-c", "commit.gpgsign=false"]

subprocess.run([*git, "init", "-q"], check=True)   # свій git: агент бачить чисте репо,
subprocess.run([*git, "add", "-A"], check=True)    # а грейдер зможе спитати git diff
subprocess.run([*git, "commit", "-qm", "seed: чистий старт пісочниці",
                "--no-verify"], check=True)

print("✅ пісочниця готова: tmp/sandbox")