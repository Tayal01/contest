# Setup before Thursday 15 Oct (do this now)

Hackathon time is for **building**, not for installing tools.  
Do **not** write the Who Knows What app yet. Only accounts, Docker, and a smoke test.

Your machine already has: Git, Python 3.14, pip, Node, npm, Docker, Docker Compose.  
Git is already named **Lakshay Tayal**.

---

## Order — do in this sequence

### 1. Open Docker Desktop (do first — you will fail without this)

Docker is **installed** but **not running** right now.

1. Open **Docker Desktop** from Applications (whale icon).
2. Wait until it says it is running (no “starting…” forever).
3. In Terminal:

```bash
docker info
```

You must see server info, not an error. If macOS asks for permissions, Allow.

**If Docker will not start:** make a **FalkorDB Cloud** account now as backup  
https://app.falkordb.cloud/signup

---

### 2. Download FalkorDB now (internet on 15 Oct can be slow)

With Docker running:

```bash
docker pull falkordb/falkordb:latest
```

This is a big image. Pulling it at 12:01 AM on Thursday wastes the first night.

---

### 3. Prove FalkorDB actually works (10 minutes)

```bash
docker run -p 6379:6379 -p 3000:3000 -it --rm falkordb/falkordb:latest
```

Then open a browser: **http://localhost:3000**

You should see FalkorDB Browser. If the page loads, you are unblocked for the whole contest.

Stop it with `Ctrl+C` in the terminal when done.

If port 3000 or 6379 is “already in use,” close the other app using that port, or tell me and we pick different ports.

---

### 4. GitHub (you must submit a **public** repo)

1. Log in at https://github.com (same account as git email `lakshaytayal@users.noreply.github.com` if that is you).
2. Confirm you can create a **public** repository. We will create the contest repo **on 15 Oct**, not now.
3. Optional: install GitHub CLI later. Not required if you can use the website.

---

### 5. LLM API key (the chat agent needs this)

Without a key, the AI part of the demo dies.

**Easiest free option:** Groq — https://console.groq.com  
Create account → API keys → copy the key → save it in a password manager.  
Do **not** paste the key into GitHub or Discord.

OpenAI also works if you already pay for it.

We will put it in a local `.env` file on Day 1. `.env` is never committed.

---

### 6. WeMakeDevs (you said you already registered)

Confirm you can still log in:  
https://www.wemakedevs.org/hackathons/falkordb  

You should see **Register now** already done / a dashboard for this hackathon.  
Submission (repo, video, track) happens on **18 Oct** in that same panel.

---

### 7. FalkorDB Discord (help + teammates if you get stuck)

https://discord.com/invite/TJ4SaPTptf  

Join **before** Thursday so you are not waiting for Discord verify during a bug.

---

### 8. Screen recording (required demo video)

On Mac: **Screenshot toolbar** (`Cmd + Shift + 5`) → Record Entire Screen.  
Or QuickTime Player → File → New Screen Recording.

Do a 10-second test recording **now** so macOS permission popups happen today, not during the final video.

---

### 9. Optional but smart

| Thing | Why |
|---|---|
| FalkorDB Cloud free account | If Docker breaks on Thursday |
| Dev.to or Hashnode account | Blog post → AirPods side prize |
| Stable Wi‑Fi / charger | 4-day online event |
| Headphones + quiet room | Video voiceover on Sunday |

---

## What you do **not** set up yet

- Do **not** write `backend/`, `frontend/`, or `seed.py` before **15 Oct, 12:01 AM IST**.
- Do **not** compile the FalkorDB GitHub engine.
- Do **not** install Neo4j.

Practicing Cypher **inside the Browser** after step 3 is allowed.

---

## Done when all of these are true

- [ ] Docker Desktop opens and `docker info` works
- [ ] `docker pull falkordb/falkordb:latest` finished
- [ ] http://localhost:3000 showed FalkorDB Browser
- [ ] GitHub login works
- [ ] Groq or OpenAI API key is saved privately
- [ ] WeMakeDevs login still works
- [ ] Discord joined
- [ ] 10-second screen recording worked

When those boxes are ticked, Thursday is only coding — not plumbing.
