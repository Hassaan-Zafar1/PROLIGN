"""
ProLign AI Interviewer — CLI Runner
Run this directly to test the full interview flow in your terminal (text-only).
Voice input/output is handled by the web frontend (VoiceInterviewer.jsx) via api.py.

Usage:
    python cli_runner.py
    python cli_runner.py --session <session_id>   # resume an existing session
"""
from dotenv import load_dotenv
import argparse
import os
import sys
from interviewer import InterviewOrchestrator, InterviewSession, get_progress
load_dotenv()

RESET  = "\033[0m"
BOLD   = "\033[1m"
CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
GRAY   = "\033[90m"
BLUE   = "\033[94m"


def print_ayla(text: str):
    print(f"\n{CYAN}{BOLD}Ayla:{RESET} {text}\n")


def print_progress(session: InterviewSession):
    p = get_progress(session)
    bar_fill = int(p["percent"] / 5)
    bar = "█" * bar_fill + "░" * (20 - bar_fill)
    print(f"{GRAY}  [{bar}] Q{p['current_question']}/{p['total_questions']} "
          f"— {p['phase_label']}{RESET}")


def print_profile(profile: dict):
    if not profile:
        print(f"{YELLOW}Profile data unavailable.{RESET}")
        return

    print(f"\n{BOLD}{BLUE}{'─'*55}")
    print(f"  MENTEE PROFILE — {profile.get('full_name', 'Mentee').upper()}")
    print(f"{'─'*55}{RESET}")

    print(f"{BOLD}University:{RESET}      {profile.get('university', '—')}")
    print(f"{BOLD}Degree:{RESET}          {profile.get('degree', '—')}")
    print(f"{BOLD}Experience:{RESET}      {profile.get('experience_level', '—').upper()}")
    print(f"{BOLD}Domain interest:{RESET} {profile.get('domain_interest', '—')}")

    print(f"\n{BOLD}Target role:{RESET}      {profile.get('target_role', '—')}")
    print(f"{BOLD}Target company:{RESET}   {profile.get('target_company_tier', '—')}")
    print(f"{BOLD}Target industry:{RESET}  {profile.get('target_industry', '—')}")

    tech = profile.get("tech_skills", [])
    if tech:
        print(f"\n{BOLD}Tech skills:{RESET}   {', '.join(tech)}")
    domain = profile.get("domain_skills", [])
    if domain:
        print(f"{BOLD}Domain skills:{RESET} {', '.join(domain)}")
    soft = profile.get("soft_skills", [])
    if soft:
        print(f"{BOLD}Soft skills:{RESET}   {', '.join(soft)}")

    print(f"\n{BOLD}Bio:{RESET}\n  {profile.get('bio', '—')}")
    print(f"\n{BLUE}{'─'*55}{RESET}")


def run_interview(orchestrator: InterviewOrchestrator, session: InterviewSession = None):
    if session is None:
        print(f"\n{BOLD}Starting new ProLign assessment interview…{RESET}")
        session, opening = orchestrator.start_session()
        print(f"{GRAY}Session ID: {session.session_id}{RESET}")
        print_ayla(opening)
        print_progress(session)
    else:
        print(f"\n{BOLD}Resuming session {session.session_id}{RESET}")
        if session.history:
            last_ayla = next(
                (m.content for m in reversed(session.history) if m.role == "assistant"), None
            )
            if last_ayla:
                from interviewer import InterviewOrchestrator as IO
                print_ayla(IO._clean_reply(last_ayla))

    while not session.is_complete:
        try:
            user_input = input(f"{GREEN}{BOLD}You:{RESET} ").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\n{YELLOW}Interview paused. Resume with: python cli_runner.py --session {session.session_id}{RESET}")
            sys.exit(0)

        if not user_input:
            continue
        if user_input.lower() in ("/quit", "/exit", "/q"):
            print(f"\n{YELLOW}Interview saved. Resume with: python cli_runner.py --session {session.session_id}{RESET}")
            sys.exit(0)

        reply, is_done = orchestrator.send_message(session, user_input, input_mode="text")
        print_ayla(reply)
        if not is_done:
            print_progress(session)

    print(f"\n{GREEN}{BOLD}✓ Interview complete!{RESET}")
    if session.profile:
        print_profile(session.profile)
        print(f"\n{GRAY}Profile saved to MongoDB (mentee_profiles collection).{RESET}")
        print(f"{GRAY}Export all profiles anytime via GET /export/mentees.csv{RESET}")


def main():
    parser = argparse.ArgumentParser(description="ProLign AI Interviewer CLI")
    parser.add_argument("--session", help="Resume an existing session by ID")
    args = parser.parse_args()

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print(f"{YELLOW}Error: GROQ_API_KEY environment variable not set.{RESET}")
        sys.exit(1)

    orchestrator = InterviewOrchestrator(api_key=api_key)

    if args.session:
        session = orchestrator.store.load(args.session)
        if not session:
            print(f"{YELLOW}Session {args.session} not found.{RESET}")
            sys.exit(1)
        run_interview(orchestrator, session)
    else:
        run_interview(orchestrator)


if __name__ == "__main__":
    main()